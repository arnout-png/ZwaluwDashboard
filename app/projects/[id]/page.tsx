import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Sparkles, Gauge, GitBranch, Triangle, Database, Globe, Activity } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { PROJECTS, getProjectLinks } from '@/lib/projects'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { CommitChart } from '@/components/dashboard/CommitChart'
import { LOCChart } from '@/components/dashboard/LOCChart'
import { calculateQualityScore } from '@/lib/quality-score'
import { QualityGauge, QualityBreakdown } from '@/components/dashboard/QualityGauge'
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector'
import { MetricsGrid } from '@/components/dashboard/MetricsGrid'
import { CommitAnalysis } from '@/components/dashboard/CommitAnalysis'
import { parseDateRange } from '@/lib/date-utils'

// Force dynamic rendering — Supabase reads happen at request time
export const dynamic = 'force-dynamic'

function deploymentBadge(state: string) {
  if (state === 'READY') return 'success' as const
  if (state === 'ERROR' || state === 'CANCELED') return 'error' as const
  if (state === 'BUILDING') return 'warning' as const
  return 'secondary' as const
}

function buildDailyData(commits: Array<{ committed_at: string }>, days: number = 30) {
  const last30 = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000)
    return d.toISOString().slice(0, 10)
  })
  const counts = Object.fromEntries(last30.map((d) => [d, 0]))
  for (const c of commits) {
    const day = c.committed_at.slice(0, 10)
    if (counts[day] !== undefined) counts[day]++
  }
  return last30.map((date) => ({ date, commits: counts[date] }))
}

export default async function ProjectDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ range?: string }> }) {
  const { id } = await params
  const sp = await searchParams
  const project = PROJECTS.find((p) => p.id === id)
  if (!project) notFound()

  const dateRange = parseDateRange(sp.range)
  const sinceISO = dateRange.since.toISOString()

  const links = getProjectLinks(project)

  const db = getSupabase()
  const [
    { data: commits },
    { data: deployments },
    { data: languages },
    { data: summary },
    { data: domains },
    { data: codeFreq },
    { data: metricsRow },
    { data: commitAnalysis },
  ] = await Promise.all([
    db.from('commits').select('sha, message, author_name, committed_at, additions, deletions, files_changed').eq('project_id', id).gte('committed_at', sinceISO).order('committed_at', { ascending: false }),
    db.from('deployments').select('deployment_id, url, state, deployed_at, build_duration_ms').eq('project_id', id).order('deployed_at', { ascending: false }).limit(20),
    db.from('language_stats').select('language, bytes').eq('project_id', id).order('bytes', { ascending: false }),
    db.from('ai_summaries').select('*').eq('project_id', id).maybeSingle(),
    db.from('vercel_domains').select('domain, is_production').eq('project_id', id).eq('is_production', true).limit(1),
    db.from('code_frequency').select('additions, deletions, week_start').eq('project_id', id).gte('week_start', sinceISO.slice(0, 10)).order('week_start', { ascending: false }),
    db.from('project_metrics').select('*').eq('project_id', id).order('metric_date', { ascending: false }).limit(1).maybeSingle(),
    db.from('ai_commit_analyses').select('summary, key_changes, patterns').eq('project_id', id).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const liveUrl = (domains ?? [])[0]?.domain ? `https://${(domains ?? [])[0].domain}` : null

  const dailyData = buildDailyData(commits ?? [], dateRange.days)
  const totalBytes = (languages ?? []).reduce((s: number, l: any) => s + l.bytes, 0)

  // Average commit size (lines changed per commit over last 30 days)
  const totalChanges30d = (codeFreq ?? []).reduce(
    (sum: number, w: any) => sum + (w.additions ?? 0) + (w.deletions ?? 0),
    0
  )
  const commitCount = (commits ?? []).length
  const avgCommitSize = commitCount > 0 ? Math.round(totalChanges30d / commitCount) : 0

  // Quality score
  const qualityResult = calculateQualityScore({
    commitCount30d: (commits ?? []).length,
    deployments: (deployments ?? []).map((d: any) => ({ state: d.state })),
    totalBytes,
    languages: (languages ?? []).map((l: any) => ({ language: l.language, bytes: l.bytes })),
    hasVercel: !!project.vercelProjectId,
    hasSupabase: !!project.supabaseRef,
    techStackCount: project.techStack.length,
    aiMaturity: summary?.maturity ?? null,
    aiStatus: summary?.status ?? null,
  })

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              <p className="mt-0.5 text-sm text-zinc-400">{project.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
        </div>

        {/* Platform links */}
        <div className="flex flex-wrap gap-2">
          <a href={links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white">
            <GitBranch className="h-4 w-4" /> GitHub
          </a>
          {links.vercel && (
            <a href={links.vercel} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white">
              <Triangle className="h-4 w-4" /> Vercel
            </a>
          )}
          {links.supabase && (
            <a href={links.supabase} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white">
              <Database className="h-4 w-4" /> Supabase
            </a>
          )}
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-cyan-800/50 bg-cyan-950/30 px-3 py-2 text-sm text-cyan-400 transition-colors hover:border-cyan-600 hover:text-cyan-300">
              <Globe className="h-4 w-4" /> Live
            </a>
          )}
        </div>

        {/* Date range selector */}
        <DateRangeSelector />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-white">{(commits ?? []).length}</p>
            <p className="text-xs text-zinc-500">Commits ({dateRange.key})</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-white">{(deployments ?? []).length}</p>
            <p className="text-xs text-zinc-500">Deployments</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-white">
              {totalBytes >= 1000 ? `~${Math.round(totalBytes / 50 / 1000)}k` : `~${Math.round(totalBytes / 50)}`}
            </p>
            <p className="text-xs text-zinc-500">Gesch. regels code</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-white">
              {metricsRow?.avg_commit_size > 0 ? `~${Math.round(metricsRow.avg_commit_size)}` : avgCommitSize > 0 ? `~${avgCommitSize}` : '—'}
            </p>
            <p className="text-xs text-zinc-500">Gem. commit grootte</p>
          </div>
        </div>

        {/* Quality Score */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-cyan-400" />
              <CardTitle>Kwaliteitsscore</CardTitle>
            </div>
          </CardHeader>
          <div className="grid gap-6 md:grid-cols-[auto_1fr] items-start px-6 pb-6">
            <QualityGauge result={qualityResult} />
            <QualityBreakdown dimensions={qualityResult.dimensions} color={project.color} />
          </div>
        </Card>

        {/* Project Metrics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <CardTitle>Project Metrics</CardTitle>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <MetricsGrid
              metrics={metricsRow ? {
                commitConsistencyScore: metricsRow.commit_consistency_score,
                deploySuccessRate: metricsRow.deploy_success_rate,
                avgBuildTimeMs: metricsRow.avg_build_time_ms,
                activeContributors: metricsRow.active_contributors,
                codeChurnRate: metricsRow.code_churn_rate,
                avgCommitSize: metricsRow.avg_commit_size,
              } : null}
              color={project.color}
            />
          </div>
        </Card>

        {/* AI Commit Analysis */}
        {commitAnalysis && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <CardTitle>Recente veranderingen</CardTitle>
              </div>
            </CardHeader>
            <div className="px-6 pb-6">
              <CommitAnalysis analysis={commitAnalysis} color={project.color} />
            </div>
          </Card>
        )}

        {/* Commit chart */}
        <Card>
          <CardHeader>
            <CardTitle>Commits per dag — afgelopen {dateRange.label}</CardTitle>
          </CardHeader>
          <CommitChart
            data={dailyData.map((d) => ({ date: d.date, [id]: d.commits }))}
            projects={[{ id, name: project.name, color: project.color }]}
          />
        </Card>

        {/* Two-col: deployments + languages */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Deployments */}
          <Card>
            <CardHeader>
              <CardTitle>Recente deployments</CardTitle>
            </CardHeader>
            {(deployments ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">Geen deployments gevonden.</p>
            ) : (
              <div className="space-y-2">
                {(deployments ?? []).map((d: any) => (
                  <div
                    key={d.deployment_id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-zinc-800/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-zinc-300">{d.deployment_id.slice(0, 12)}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(d.deployed_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={deploymentBadge(d.state)}>{d.state}</Badge>
                      {d.url && (
                        <a
                          href={`https://${d.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-zinc-300"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Language breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Taalverdeling</CardTitle>
            </CardHeader>
            {(languages ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">Geen taaldata beschikbaar.</p>
            ) : (
              <div className="space-y-2">
                {(languages ?? []).slice(0, 8).map((l: any) => {
                  const pct = totalBytes > 0 ? Math.round((l.bytes / totalBytes) * 100) : 0
                  return (
                    <div key={l.language}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-zinc-300">{l.language}</span>
                        <span className="text-zinc-500">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: project.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* AI summary */}
        {summary && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <CardTitle>AI-projectanalyse</CardTitle>
                <Badge
                  variant={
                    summary.status === 'active'
                      ? 'success'
                      : summary.status === 'maintenance'
                      ? 'warning'
                      : summary.status === 'inactive'
                      ? 'error'
                      : 'secondary'
                  }
                  className="ml-auto"
                >
                  {summary.status}
                </Badge>
              </div>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Doel</p>
                <p className="text-sm text-zinc-300">{summary.goal}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Bedrijfswaarde</p>
                <p className="text-sm text-zinc-300">{summary.business_value}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Inzicht</p>
                <p className="text-sm text-zinc-300">{summary.key_insight}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Volwassenheid ({summary.maturity}/5)
                </p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full ${i <= summary.maturity ? '' : 'bg-zinc-700'}`}
                      style={i <= summary.maturity ? { backgroundColor: project.color } : undefined}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Recent commits */}
        <Card>
          <CardHeader>
            <CardTitle>Recente commits</CardTitle>
          </CardHeader>
          {(commits ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">Geen commits gevonden in de afgelopen 30 dagen.</p>
          ) : (
            <div className="space-y-1">
              {(commits ?? []).slice(0, 20).map((c: any) => (
                <div
                  key={c.sha}
                  className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-zinc-800/50"
                >
                  <span className="mt-0.5 font-mono text-xs text-zinc-600">{c.sha.slice(0, 7)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-300">{c.message}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <span>{c.author_name}</span>
                      <span>·</span>
                      <span>{new Date(c.committed_at).toLocaleDateString('nl-NL')}</span>
                      {c.additions != null && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-500">+{c.additions}</span>
                          <span className="text-red-400">-{c.deletions}</span>
                          {c.files_changed != null && (
                            <span className="text-zinc-500">{c.files_changed} files</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}

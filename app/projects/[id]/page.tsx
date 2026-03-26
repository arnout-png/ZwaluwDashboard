import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { PROJECTS } from '@/lib/projects'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { CommitChart } from '@/components/dashboard/CommitChart'
import { LOCChart } from '@/components/dashboard/LOCChart'

// Force dynamic rendering — Supabase reads happen at request time
export const dynamic = 'force-dynamic'

function deploymentBadge(state: string) {
  if (state === 'READY') return 'success' as const
  if (state === 'ERROR' || state === 'CANCELED') return 'error' as const
  if (state === 'BUILDING') return 'warning' as const
  return 'secondary' as const
}

function buildDailyData(commits: Array<{ committed_at: string }>) {
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86_400_000)
    return d.toISOString().slice(0, 10)
  })
  const counts = Object.fromEntries(last30.map((d) => [d, 0]))
  for (const c of commits) {
    const day = c.committed_at.slice(0, 10)
    if (counts[day] !== undefined) counts[day]++
  }
  return last30.map((date) => ({ date, commits: counts[date] }))
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = PROJECTS.find((p) => p.id === id)
  if (!project) notFound()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const db = getSupabase()
  const [
    { data: commits },
    { data: deployments },
    { data: languages },
    { data: summary },
  ] = await Promise.all([
    db.from('commits').select('sha, message, author_name, committed_at').eq('project_id', id).gte('committed_at', thirtyDaysAgo).order('committed_at', { ascending: false }),
    db.from('deployments').select('deployment_id, url, state, deployed_at').eq('project_id', id).order('deployed_at', { ascending: false }).limit(10),
    db.from('language_stats').select('language, bytes').eq('project_id', id).order('bytes', { ascending: false }),
    db.from('ai_summaries').select('*').eq('project_id', id).maybeSingle(),
  ])

  const dailyData = buildDailyData(commits ?? [])
  const totalBytes = (languages ?? []).reduce((s: number, l: any) => s + l.bytes, 0)

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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-white">{(commits ?? []).length}</p>
            <p className="text-xs text-zinc-500">Commits (30d)</p>
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
        </div>

        {/* Commit chart */}
        <Card>
          <CardHeader>
            <CardTitle>Commits per dag — afgelopen 30 dagen</CardTitle>
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
                    <p className="text-xs text-zinc-600">
                      {c.author_name} · {new Date(c.committed_at).toLocaleDateString('nl-NL')}
                    </p>
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

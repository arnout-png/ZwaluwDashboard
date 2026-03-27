import { getSupabase } from '@/lib/supabase'
import { PROJECTS, getProjectLinks } from '@/lib/projects'
import { KPIBar } from '@/components/dashboard/KPIBar'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { CommitChart } from '@/components/dashboard/CommitChart'
import { LOCChart } from '@/components/dashboard/LOCChart'
import { PortfolioSummary } from '@/components/dashboard/PortfolioSummary'
import { QuickLinks } from '@/components/dashboard/QuickLinks'
import { QualityLeaderboard } from '@/components/dashboard/QualityLeaderboard'
import { CostSummaryMini } from '@/components/dashboard/CostSummaryMini'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { SyncButton } from '@/components/dashboard/SyncButton'
import { calculateQualityScore, type QualityResult } from '@/lib/quality-score'
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector'
import { parseDateRange } from '@/lib/date-utils'

// Force dynamic rendering — Supabase reads happen at request time
export const dynamic = 'force-dynamic'

// ─── helpers ───────────────────────────────────────────────────────────────

function buildCommitsByDay(
  commits: Array<{ project_id: string; committed_at: string }>,
  days: number = 30
): { byProject: Record<string, { date: string; count: number }[]>; chartData: Record<string, string | number>[] } {
  const last30 = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000)
    return d.toISOString().slice(0, 10)
  })

  const raw: Record<string, Record<string, number>> = {}
  for (const p of PROJECTS) {
    raw[p.id] = Object.fromEntries(last30.map((d) => [d, 0]))
  }
  for (const c of commits) {
    const day = c.committed_at.slice(0, 10)
    if (raw[c.project_id]?.[day] !== undefined) raw[c.project_id][day]++
  }

  const byProject: Record<string, { date: string; count: number }[]> = {}
  for (const p of PROJECTS) {
    byProject[p.id] = last30.map((date) => ({ date, count: raw[p.id][date] ?? 0 }))
  }

  const chartData = last30.map((date) => {
    const entry: Record<string, string | number> = { date }
    for (const p of PROJECTS) entry[p.id] = raw[p.id]?.[date] ?? 0
    return entry
  })

  return { byProject, chartData }
}

// ─── page ──────────────────────────────────────────────────────────────────

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const sp = await searchParams
  const dateRange = parseDateRange(sp.range)
  const sinceISO = dateRange.since.toISOString()

  const db = getSupabase()
  const [
    { data: commits },
    { data: deployments },
    { data: languages },
    { data: summaries },
    { data: portfolioRows },
    { data: syncLog },
    { data: costRows },
    { data: domains },
    { data: prs },
  ] = await Promise.all([
    db.from('commits').select('project_id, sha, message, author_name, committed_at, additions, deletions, files_changed').gte('committed_at', sinceISO).order('committed_at', { ascending: false }),
    db.from('deployments').select('project_id, state, url, deployed_at').order('deployed_at', { ascending: false }),
    db.from('language_stats').select('project_id, language, bytes'),
    db.from('ai_summaries').select('*'),
    db.from('portfolio_summaries').select('summary, generated_at').order('generated_at', { ascending: false }).limit(1),
    db.from('sync_logs').select('completed_at, status').eq('status', 'success').order('completed_at', { ascending: false }).limit(1),
    db.from('cost_estimates').select('service_id, amount_eur, source').eq('month', new Date().toISOString().slice(0, 7)),
    db.from('vercel_domains').select('project_id, domain, is_production').eq('is_production', true),
    db.from('github_prs').select('project_id, title, created_at, url').eq('state', 'open').order('created_at', { ascending: false }).limit(10),
  ])

  const { byProject, chartData } = buildCommitsByDay(commits ?? [], dateRange.days)

  // Latest deployment per project
  const latestDeploy: Record<string, { state: string; url: string; deployed_at: string }> = {}
  for (const d of deployments ?? []) {
    if (!latestDeploy[d.project_id]) {
      latestDeploy[d.project_id] = { state: d.state, url: d.url, deployed_at: d.deployed_at }
    }
  }

  // Live URLs from domains
  const liveUrls: Record<string, string> = {}
  for (const d of domains ?? []) {
    if (!liveUrls[d.project_id]) liveUrls[d.project_id] = `https://${d.domain}`
  }

  // Total bytes per project
  const totalBytes: Record<string, number> = {}
  for (const l of languages ?? []) {
    totalBytes[l.project_id] = (totalBytes[l.project_id] ?? 0) + l.bytes
  }

  // Summaries map
  const summaryMap: Record<string, any> = {}
  for (const s of summaries ?? []) summaryMap[s.project_id] = s

  // KPIs
  const totalCommits = (commits ?? []).length
  const activeProjects = Object.values(summaryMap).filter(
    (s) => s.status === 'active'
  ).length
  const totalDeployments = new Set(
    (deployments ?? [])
      .filter((d) => new Date(d.deployed_at) > dateRange.since)
      .map((d) => d.project_id + d.deployed_at)
  ).size

  // Quality scores per project
  const qualityScores: Record<string, QualityResult> = {}
  for (const p of PROJECTS) {
    const projectCommits = (commits ?? []).filter((c) => c.project_id === p.id)
    const projectDeploys = (deployments ?? []).filter((d) => d.project_id === p.id)
    const projectLangs = (languages ?? []).filter((l: any) => l.project_id === p.id)
    const projectBytes = projectLangs.reduce((s: number, l: any) => s + (l.bytes ?? 0), 0)

    qualityScores[p.id] = calculateQualityScore({
      commitCount30d: projectCommits.length,
      deployments: projectDeploys.map((d) => ({ state: d.state })),
      totalBytes: projectBytes,
      languages: projectLangs.map((l: any) => ({ language: l.language ?? '', bytes: l.bytes ?? 0 })),
      hasVercel: !!p.vercelProjectId,
      hasSupabase: !!p.supabaseRef,
      techStackCount: p.techStack.length,
      aiMaturity: summaryMap[p.id]?.maturity ?? null,
      aiStatus: summaryMap[p.id]?.status ?? null,
    })
  }

  const scoredProjects = Object.values(qualityScores).filter((q) => !q.planned)
  const avgQuality = scoredProjects.length > 0
    ? Math.round(scoredProjects.reduce((s, q) => s + q.score, 0) / scoredProjects.length)
    : 0

  // Cost data
  const totalCostEur = (costRows ?? []).reduce((s: number, c: any) => s + (c.amount_eur ?? 0), 0)

  // Quick links data
  const quickLinksData = PROJECTS.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    links: getProjectLinks(p),
    vercelLiveUrl: liveUrls[p.id] ?? null,
  }))

  // Quality leaderboard data
  const leaderboardData = PROJECTS
    .map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      score: qualityScores[p.id]?.score ?? 0,
      grade: qualityScores[p.id]?.grade ?? ('F' as const),
    }))
    .sort((a, b) => b.score - a.score)

  // Cost summary data
  const costSummaryData = (costRows ?? [])
    .map((c: any) => ({ serviceName: c.service_id, amountEur: c.amount_eur, source: c.source }))
    .sort((a: any, b: any) => b.amountEur - a.amountEur)
    .slice(0, 5)

  // Activity feed data — merge commits + deployments + PRs
  const projectMap = Object.fromEntries(PROJECTS.map((p) => [p.id, p]))
  const activityEvents = [
    ...(commits ?? []).slice(0, 30).map((c: any) => ({
      type: 'commit' as const,
      projectId: c.project_id,
      projectName: projectMap[c.project_id]?.name ?? c.project_id,
      projectColor: projectMap[c.project_id]?.color ?? '#71717a',
      message: c.message,
      timestamp: c.committed_at,
    })),
    ...(deployments ?? []).filter((d) => new Date(d.deployed_at) > dateRange.since).slice(0, 20).map((d: any) => ({
      type: 'deploy' as const,
      projectId: d.project_id,
      projectName: projectMap[d.project_id]?.name ?? d.project_id,
      projectColor: projectMap[d.project_id]?.color ?? '#71717a',
      message: `Deploy naar ${d.state === 'READY' ? 'production' : d.state.toLowerCase()} (${d.state})`,
      timestamp: d.deployed_at,
    })),
    ...(prs ?? []).map((pr: any) => ({
      type: 'pr' as const,
      projectId: pr.project_id,
      projectName: projectMap[pr.project_id]?.name ?? pr.project_id,
      projectColor: projectMap[pr.project_id]?.color ?? '#71717a',
      message: `PR: ${pr.title}`,
      timestamp: pr.created_at,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15)

  const portfolioSummary = portfolioRows?.[0] ?? null
  const lastSync = syncLog?.[0]?.completed_at ?? null

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Zwaluw Dashboard</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Portfolio analytics · {PROJECTS.length} projecten
              {lastSync && (
                <> · gesynchroniseerd {new Date(lastSync).toLocaleDateString('nl-NL')}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeSelector />
            <SyncButton />
          </div>
        </div>

        {/* KPI bar */}
        <KPIBar
          totalCommits={totalCommits}
          activeProjects={activeProjects}
          totalDeployments={totalDeployments}
          avgQuality={avgQuality}
          totalCostEur={totalCostEur > 0 ? totalCostEur : null}
        />

        {/* Quick links */}
        <QuickLinks projects={quickLinksData} />

        {/* Two-col: Commit chart + Quality leaderboard */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Commit-frequentie — afgelopen {dateRange.label}</CardTitle>
            </CardHeader>
            <CommitChart
              data={chartData}
              projects={PROJECTS.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kwaliteitsranking</CardTitle>
            </CardHeader>
            <QualityLeaderboard items={leaderboardData} />
          </Card>
        </div>

        {/* Activity feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recente activiteit</CardTitle>
          </CardHeader>
          <ActivityFeed events={activityEvents} />
        </Card>

        {/* Project cards */}
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Projecten
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PROJECTS.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                commitsByDay={byProject[project.id] ?? []}
                latestDeployment={latestDeploy[project.id] ?? null}
                summary={summaryMap[project.id] ?? null}
                qualityScore={qualityScores[project.id] ?? null}
              />
            ))}
          </div>
        </div>

        {/* Two-col: LOC chart + Cost summary */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Geschatte regels code per project</CardTitle>
            </CardHeader>
            <LOCChart
              data={PROJECTS.map((p) => ({
                id: p.id,
                name: p.name,
                color: p.color,
                totalBytes: totalBytes[p.id] ?? 0,
              }))}
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kosten deze maand</CardTitle>
            </CardHeader>
            <CostSummaryMini
              costs={costSummaryData}
              totalEur={totalCostEur}
              deltaPercent={null}
            />
          </Card>
        </div>

        {/* AI portfolio summary */}
        {portfolioSummary && (
          <PortfolioSummary
            summary={portfolioSummary.summary}
            generatedAt={portfolioSummary.generated_at}
          />
        )}

        {!portfolioSummary && (
          <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-500">
            Nog geen AI-samenvatting beschikbaar. Voer eerst een sync uit.
          </div>
        )}
      </div>
    </main>
  )
}

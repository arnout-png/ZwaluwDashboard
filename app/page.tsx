import { getSupabase } from '@/lib/supabase'
import { PROJECTS } from '@/lib/projects'
import { KPIBar } from '@/components/dashboard/KPIBar'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { CommitChart } from '@/components/dashboard/CommitChart'
import { LOCChart } from '@/components/dashboard/LOCChart'
import { PortfolioSummary } from '@/components/dashboard/PortfolioSummary'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { SyncButton } from '@/components/dashboard/SyncButton'
import { calculateQualityScore, type QualityResult } from '@/lib/quality-score'

// Force dynamic rendering — Supabase reads happen at request time
export const dynamic = 'force-dynamic'

// ─── helpers ───────────────────────────────────────────────────────────────

function buildCommitsByDay(
  commits: Array<{ project_id: string; committed_at: string }>
): { byProject: Record<string, { date: string; count: number }[]>; chartData: Record<string, string | number>[] } {
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86_400_000)
    return d.toISOString().slice(0, 10)
  })

  // per-project daily counts
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

export default async function DashboardPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const db = getSupabase()
  const [
    { data: commits },
    { data: deployments },
    { data: languages },
    { data: summaries },
    { data: portfolioRows },
    { data: syncLog },
  ] = await Promise.all([
    db.from('commits').select('project_id, committed_at').gte('committed_at', thirtyDaysAgo),
    db.from('deployments').select('project_id, state, url, deployed_at').order('deployed_at', { ascending: false }),
    db.from('language_stats').select('project_id, language, bytes'),
    db.from('ai_summaries').select('*'),
    db.from('portfolio_summaries').select('summary, generated_at').order('generated_at', { ascending: false }).limit(1),
    db.from('sync_logs').select('completed_at, status').eq('status', 'success').order('completed_at', { ascending: false }).limit(1),
  ])

  const { byProject, chartData } = buildCommitsByDay(commits ?? [])

  // Latest deployment per project
  const latestDeploy: Record<string, { state: string; url: string }> = {}
  for (const d of deployments ?? []) {
    if (!latestDeploy[d.project_id]) {
      latestDeploy[d.project_id] = { state: d.state, url: d.url }
    }
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
      .filter((d) => new Date(d.deployed_at) > new Date(thirtyDaysAgo))
      .map((d) => d.project_id + d.deployed_at)
  ).size
  const maturities = Object.values(summaryMap).map((s) => s.maturity ?? 1)
  const avgMaturity =
    maturities.length > 0 ? maturities.reduce((a, b) => a + b, 0) / maturities.length : 0

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
          <SyncButton />
        </div>

        {/* KPI bar */}
        <KPIBar
          totalCommits={totalCommits}
          activeProjects={activeProjects}
          totalDeployments={totalDeployments}
          avgMaturity={avgMaturity}
        />

        {/* Commit frequency chart */}
        <Card>
          <CardHeader>
            <CardTitle>Commit-frequentie — afgelopen 30 dagen</CardTitle>
          </CardHeader>
          <CommitChart
            data={chartData}
            projects={PROJECTS.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
          />
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

        {/* LOC chart */}
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

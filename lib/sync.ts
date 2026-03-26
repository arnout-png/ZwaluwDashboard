import { PROJECTS } from './projects'
import { getCommits, getLanguages } from './github'
import { getDeployments } from './vercel-client'
import { generateProjectSummary, generatePortfolioSummary } from './ai'
import { supabaseAdmin } from './supabase'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function syncAll() {
  const logId = await startLog()
  let synced = 0
  try {
    await seedProjects()
    const results = await Promise.allSettled(PROJECTS.map((p) => syncProject(p.id)))
    synced = results.filter((r) => r.status === 'fulfilled').length
    await refreshPortfolioSummary()
    await finishLog(logId, 'success', synced)
  } catch (err) {
    await finishLog(logId, 'error', synced, String(err))
    throw err
  }
}

async function seedProjects() {
  const { data: existing } = await supabaseAdmin.from('projects').select('id')
  const ids = new Set((existing ?? []).map((p: any) => p.id))
  const toInsert = PROJECTS.filter((p) => !ids.has(p.id)).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    github_owner: p.githubOwner,
    github_repo: p.githubRepo,
    vercel_project_id: p.vercelProjectId,
    tech_stack: p.techStack,
    color: p.color,
  }))
  if (toInsert.length > 0) {
    await supabaseAdmin.from('projects').insert(toInsert)
  }
}

export async function syncProject(projectId: string) {
  const project = PROJECTS.find((p) => p.id === projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const since = new Date(Date.now() - THIRTY_DAYS_MS)
  const [commits, languages, deployments] = await Promise.all([
    getCommits(project.githubOwner, project.githubRepo, since),
    getLanguages(project.githubOwner, project.githubRepo),
    project.vercelProjectId ? getDeployments(project.vercelProjectId) : Promise.resolve([]),
  ])

  // Upsert commits
  if (commits.length > 0) {
    await supabaseAdmin.from('commits').upsert(
      commits.map((c) => ({
        id: `${project.id}-${c.sha}`,
        project_id: project.id,
        sha: c.sha,
        message: c.message,
        author_name: c.author,
        committed_at: c.date,
      })),
      { onConflict: 'id' }
    )
  }

  // Upsert deployments
  if (deployments.length > 0) {
    await supabaseAdmin.from('deployments').upsert(
      deployments.map((d) => ({
        id: `${project.id}-${d.id}`,
        project_id: project.id,
        deployment_id: d.id,
        url: d.url,
        state: d.state,
        deployed_at: new Date(d.createdAt).toISOString(),
      })),
      { onConflict: 'id' }
    )
  }

  // Upsert language stats
  const langRows = Object.entries(languages).map(([language, bytes]) => ({
    project_id: project.id,
    language,
    bytes,
    synced_at: new Date().toISOString(),
  }))
  if (langRows.length > 0) {
    await supabaseAdmin
      .from('language_stats')
      .upsert(langRows, { onConflict: 'project_id,language' })
  }

  // Refresh AI summary if expired
  const { data: existing } = await supabaseAdmin
    .from('ai_summaries')
    .select('expires_at')
    .eq('project_id', project.id)
    .maybeSingle()

  const expired = !existing || new Date(existing.expires_at) < new Date()
  if (expired) {
    const summary = await generateProjectSummary({
      name: project.name,
      description: project.description,
      techStack: project.techStack,
      recentCommits: commits.slice(0, 10).map((c) => c.message),
      commitCount30d: commits.length,
      languages,
      lastDeploymentState: deployments[0]?.state,
    })
    if (summary) {
      await supabaseAdmin.from('ai_summaries').upsert(
        {
          project_id: project.id,
          ...summary,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + SEVEN_DAYS_MS).toISOString(),
        },
        { onConflict: 'project_id' }
      )
    }
  }
}

async function refreshPortfolioSummary() {
  const { data: latest } = await supabaseAdmin
    .from('portfolio_summaries')
    .select('expires_at')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest && new Date(latest.expires_at) > new Date()) return

  const { data: summaries } = await supabaseAdmin
    .from('ai_summaries')
    .select('project_id, goal, status, maturity')

  const { data: commitRows } = await supabaseAdmin
    .from('commits')
    .select('project_id')
    .gte('committed_at', new Date(Date.now() - THIRTY_DAYS_MS).toISOString())

  if (!summaries?.length) return

  const countByProject = (commitRows ?? []).reduce(
    (acc: Record<string, number>, c: any) => {
      acc[c.project_id] = (acc[c.project_id] ?? 0) + 1
      return acc
    },
    {}
  )

  const portfolioSummary = await generatePortfolioSummary(
    summaries.map((s: any) => ({
      name: PROJECTS.find((p) => p.id === s.project_id)?.name ?? s.project_id,
      status: s.status ?? 'unknown',
      maturity: s.maturity ?? 1,
      commitCount30d: countByProject[s.project_id] ?? 0,
      goal: s.goal ?? '',
    }))
  )

  if (portfolioSummary) {
    await supabaseAdmin.from('portfolio_summaries').insert({
      summary: portfolioSummary,
      expires_at: new Date(Date.now() + SEVEN_DAYS_MS).toISOString(),
    })
  }
}

async function startLog(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('sync_logs')
    .insert({ status: 'running' })
    .select('id')
    .single()
  return data?.id ?? ''
}

async function finishLog(
  id: string,
  status: 'success' | 'error',
  projects_synced: number,
  error?: string
) {
  await supabaseAdmin
    .from('sync_logs')
    .update({ status, completed_at: new Date().toISOString(), projects_synced, error })
    .eq('id', id)
}

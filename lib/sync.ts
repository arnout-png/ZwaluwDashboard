import { PROJECTS } from './projects'
import { getCommits, getLanguages, getPullRequests, getIssues, getBranches } from './github'
import { getDeployments, getProjectDomains } from './vercel-client'
import { generateProjectSummary, generatePortfolioSummary } from './ai'
import { getSupabaseAdmin } from './supabase'
import { SERVICES, SERVICE_CONNECTIONS, INFRA_EDGES } from './services-registry'
import { resolveAllCosts } from './costs'
import { getSupabaseHealth, SUPABASE_REFS } from './supabase-mgmt'

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
    await syncInfrastructure()
    await finishLog(logId, 'success', synced)
  } catch (err) {
    await finishLog(logId, 'error', synced, String(err))
    throw err
  }
}

async function seedProjects() {
  const { data: existing } = await getSupabaseAdmin().from('projects').select('id')
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
    await getSupabaseAdmin().from('projects').insert(toInsert)
  }
}

export async function syncProject(projectId: string) {
  const project = PROJECTS.find((p) => p.id === projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const since = new Date(Date.now() - THIRTY_DAYS_MS)

  const [commits, languages, deployments, prs, issues, branches, domains] = await Promise.all([
    getCommits(project.githubOwner, project.githubRepo, since),
    getLanguages(project.githubOwner, project.githubRepo),
    project.vercelProjectId ? getDeployments(project.vercelProjectId) : Promise.resolve([]),
    getPullRequests(project.githubOwner, project.githubRepo, 'open'),
    getIssues(project.githubOwner, project.githubRepo, 'open'),
    getBranches(project.githubOwner, project.githubRepo),
    project.vercelProjectId ? getProjectDomains(project.vercelProjectId) : Promise.resolve([]),
  ])

  // Upsert commits
  if (commits.length > 0) {
    await getSupabaseAdmin().from('commits').upsert(
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

  // Upsert deployments (extended with branch + build duration)
  if (deployments.length > 0) {
    await getSupabaseAdmin().from('deployments').upsert(
      deployments.map((d) => ({
        id: `${project.id}-${d.id}`,
        project_id: project.id,
        deployment_id: d.id,
        url: d.url,
        state: d.state,
        deployed_at: new Date(d.createdAt).toISOString(),
        branch: d.branch,
        commit_sha: d.commitSha,
        build_duration_ms: d.buildDurationMs,
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
    await getSupabaseAdmin()
      .from('language_stats')
      .upsert(langRows, { onConflict: 'project_id,language' })
  }

  // Upsert open PRs
  if (prs.length > 0) {
    await getSupabaseAdmin().from('github_prs').upsert(
      prs.map((pr) => ({
        id: `${project.id}-${pr.number}`,
        project_id: project.id,
        pr_number: pr.number,
        title: pr.title,
        state: pr.state,
        author: pr.author,
        base_branch: pr.baseBranch,
        head_branch: pr.headBranch,
        created_at: pr.createdAt,
        merged_at: pr.mergedAt,
        url: pr.url,
      })),
      { onConflict: 'id' }
    )
  }

  // Upsert open issues
  if (issues.length > 0) {
    await getSupabaseAdmin().from('github_issues').upsert(
      issues.map((issue) => ({
        id: `${project.id}-${issue.number}`,
        project_id: project.id,
        issue_number: issue.number,
        title: issue.title,
        state: issue.state,
        author: issue.author,
        labels: issue.labels,
        created_at: issue.createdAt,
        closed_at: issue.closedAt,
        url: issue.url,
      })),
      { onConflict: 'id' }
    )
  }

  // Upsert branches
  if (branches.length > 0) {
    await getSupabaseAdmin().from('github_branches').upsert(
      branches.map((b) => ({
        id: `${project.id}-${b.name}`,
        project_id: project.id,
        name: b.name,
        is_default: b.isDefault,
        last_commit_sha: b.lastCommitSha,
        last_commit_date: b.lastCommitDate || null,
      })),
      { onConflict: 'id' }
    )
  }

  // Upsert Vercel domains
  if (domains.length > 0) {
    await getSupabaseAdmin().from('vercel_domains').upsert(
      domains.map((d) => ({
        id: `${project.id}-${d.name}`,
        project_id: project.id,
        domain: d.name,
        is_production: !d.gitBranch || d.gitBranch === 'main' || d.gitBranch === 'master',
        verified: d.verified,
      })),
      { onConflict: 'id' }
    )
  }

  // Refresh AI summary if expired
  const { data: existing } = await getSupabaseAdmin()
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
      await getSupabaseAdmin().from('ai_summaries').upsert(
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
  const { data: latest } = await getSupabaseAdmin()
    .from('portfolio_summaries')
    .select('expires_at')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest && new Date(latest.expires_at) > new Date()) return

  const { data: summaries } = await getSupabaseAdmin()
    .from('ai_summaries')
    .select('project_id, goal, status, maturity')

  const { data: commitRows } = await getSupabaseAdmin()
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
    await getSupabaseAdmin().from('portfolio_summaries').insert({
      summary: portfolioSummary,
      expires_at: new Date(Date.now() + SEVEN_DAYS_MS).toISOString(),
    })
  }
}

async function syncInfrastructure() {
  await syncServicesRegistry()
  await syncCostEstimates()
  await syncSupabaseHealth()
}

async function syncServicesRegistry() {
  const supabase = getSupabaseAdmin()

  // Upsert service definitions
  await supabase.from('services').upsert(
    SERVICES.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      provider: s.provider,
      icon_slug: s.iconSlug,
      docs_url: s.docsUrl,
      has_cost_api: s.hasCostApi,
      notes: s.notes ?? null,
    })),
    { onConflict: 'id' }
  )

  // Upsert service connections
  if (SERVICE_CONNECTIONS.length > 0) {
    await supabase.from('service_connections').upsert(
      SERVICE_CONNECTIONS.map((c) => ({
        service_id: c.serviceId,
        project_id: c.projectId,
        env_keys: c.envKeys,
      })),
      { onConflict: 'service_id,project_id' }
    )
  }

  // Upsert infra edges
  if (INFRA_EDGES.length > 0) {
    await supabase.from('infra_edges').upsert(
      INFRA_EDGES.map((e) => ({
        from_id: e.fromId,
        from_type: e.fromType,
        to_id: e.toId,
        to_type: e.toType,
        edge_type: e.edgeType,
        label: e.label ?? null,
      })),
      { onConflict: 'from_id,to_id,edge_type' }
    )
  }
}

async function syncCostEstimates() {
  const month = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  const costs = await resolveAllCosts()

  if (costs.length > 0) {
    await getSupabaseAdmin().from('cost_estimates').upsert(
      costs.map((c) => ({
        service_id: c.serviceId,
        month,
        amount_eur: c.amountEur,
        source: c.source,
        plan_name: c.planName,
        synced_at: new Date().toISOString(),
      })),
      { onConflict: 'service_id,month' }
    )
  }
}

async function syncSupabaseHealth() {
  const token = process.env.SUPABASE_MGMT_TOKEN
  if (!token) return // gracefully skip if no management token

  const projectEntries = Object.entries(SUPABASE_REFS)
  const results = await Promise.allSettled(
    projectEntries.map(async ([projectId, ref]) => {
      const health = await getSupabaseHealth(ref)
      if (!health) return

      await getSupabaseAdmin().from('supabase_health').insert({
        supabase_ref: ref,
        project_id: projectId,
        db_size_mb: health.dbSizeMb,
        active_connections: health.activeConnections,
        synced_at: new Date().toISOString(),
      })
    })
  )

  // Log any failures silently — don't break main sync
  results.forEach((r) => {
    if (r.status === 'rejected') console.warn('supabase health sync failed:', r.reason)
  })
}

async function startLog(): Promise<string> {
  const { data } = await getSupabaseAdmin()
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
  await getSupabaseAdmin()
    .from('sync_logs')
    .update({ status, completed_at: new Date().toISOString(), projects_synced, error })
    .eq('id', id)
}

import { getSupabaseAdmin } from '@/lib/supabase'
import { PROJECTS } from '@/lib/projects'
import { GitPullRequest, AlertCircle, GitBranch, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = getSupabaseAdmin()

  const [{ data: prs }, { data: issues }, { data: branches }] = await Promise.all([
    supabase
      .from('github_prs')
      .select('*')
      .eq('state', 'open')
      .order('created_at', { ascending: false }),
    supabase
      .from('github_issues')
      .select('*')
      .eq('state', 'open')
      .order('created_at', { ascending: false }),
    supabase
      .from('github_branches')
      .select('*')
      .order('last_commit_date', { ascending: false }),
  ])

  return { prs: prs ?? [], issues: issues ?? [], branches: branches ?? [] }
}

function projectName(id: string) {
  return PROJECTS.find((p) => p.id === id)?.name ?? id
}

function projectColor(id: string) {
  return PROJECTS.find((p) => p.id === id)?.color ?? '#71717a'
}

function relativeTime(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days === 0) return 'vandaag'
  if (days === 1) return 'gisteren'
  return `${days}d geleden`
}

function isStale(dateStr: string | null) {
  if (!dateStr) return false
  return Date.now() - new Date(dateStr).getTime() > 60 * 86400000 // 60 days
}

export default async function GitHubPage() {
  const { prs, issues, branches } = await getData()

  const staleBranches = branches.filter((b: any) => !b.is_default && isStale(b.last_commit_date))
  const activeBranches = branches.filter((b: any) => !isStale(b.last_commit_date) || b.is_default)

  // Group branches by project
  const branchesByProject: Record<string, any[]> = {}
  for (const b of branches) {
    if (!branchesByProject[b.project_id]) branchesByProject[b.project_id] = []
    branchesByProject[b.project_id].push(b)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">GitHub Activity</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Open pull requests, issues en branches over alle projecten</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Open PRs', value: prs.length, icon: GitPullRequest, color: 'text-violet-400' },
          { label: 'Open Issues', value: issues.length, icon: AlertCircle, color: 'text-red-400' },
          { label: 'Actieve Branches', value: activeBranches.length, icon: GitBranch, color: 'text-blue-400' },
          { label: 'Verouderd (60d+)', value: staleBranches.length, icon: Clock, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className="text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Open PRs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <GitPullRequest size={14} className="text-violet-400" />
              Open Pull Requests ({prs.length})
            </CardTitle>
          </CardHeader>
          <div className="px-4 pb-4 space-y-2">
            {prs.length === 0 ? (
              <p className="text-xs text-zinc-600 py-2">Geen open pull requests</p>
            ) : (
              prs.map((pr: any) => (
                <a
                  key={pr.id}
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-white">{pr.title}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      #{pr.pr_number} · {pr.author} · {relativeTime(pr.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ background: projectColor(pr.project_id) + '20', color: projectColor(pr.project_id) }}
                    >
                      {projectName(pr.project_id)}
                    </span>
                    <p className="text-[10px] text-zinc-600">{pr.head_branch}</p>
                  </div>
                </a>
              ))
            )}
          </div>
        </Card>

        {/* Open Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertCircle size={14} className="text-red-400" />
              Open Issues ({issues.length})
            </CardTitle>
          </CardHeader>
          <div className="px-4 pb-4 space-y-2">
            {issues.length === 0 ? (
              <p className="text-xs text-zinc-600 py-2">Geen open issues</p>
            ) : (
              issues.map((issue: any) => (
                <a
                  key={issue.id}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-white">{issue.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500">#{issue.issue_number} · {issue.author}</span>
                      {(issue.labels ?? []).slice(0, 2).map((label: string) => (
                        <span key={label} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: projectColor(issue.project_id) + '20', color: projectColor(issue.project_id) }}
                  >
                    {projectName(issue.project_id)}
                  </span>
                </a>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Branches per Project */}
      <div>
        <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <GitBranch size={14} />
          Branches per Project
          {staleBranches.length > 0 && (
            <Badge variant="warning">{staleBranches.length} verouderd</Badge>
          )}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(branchesByProject).map(([projectId, projectBranches]) => (
            <Card key={projectId}>
              <CardHeader>
                <CardTitle className="text-xs flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: projectColor(projectId) }}
                  />
                  {projectName(projectId)}
                  <span className="text-zinc-600 font-normal">{projectBranches.length} branches</span>
                </CardTitle>
              </CardHeader>
              <div className="px-4 pb-3 space-y-1">
                {projectBranches.slice(0, 8).map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {b.is_default && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded">default</span>
                      )}
                      {!b.is_default && isStale(b.last_commit_date) && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 rounded">oud</span>
                      )}
                      <span className="text-xs text-zinc-300 font-mono truncate">{b.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 shrink-0">{relativeTime(b.last_commit_date)}</span>
                  </div>
                ))}
                {projectBranches.length > 8 && (
                  <p className="text-[10px] text-zinc-600 pt-1">+{projectBranches.length - 8} meer</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

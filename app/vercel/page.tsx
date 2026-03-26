import { getSupabaseAdmin } from '@/lib/supabase'
import { PROJECTS } from '@/lib/projects'
import { Triangle, Globe, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = getSupabaseAdmin()

  const [{ data: deployments }, { data: domains }] = await Promise.all([
    supabase
      .from('deployments')
      .select('*')
      .order('deployed_at', { ascending: false }),
    supabase
      .from('vercel_domains')
      .select('*')
      .order('project_id'),
  ])

  return { deployments: deployments ?? [], domains: domains ?? [] }
}

function projectName(id: string) {
  return PROJECTS.find((p) => p.id === id)?.name ?? id
}
function projectColor(id: string) {
  return PROJECTS.find((p) => p.id === id)?.color ?? '#71717a'
}

function stateVariant(state: string) {
  if (state === 'READY') return 'success'
  if (state === 'ERROR' || state === 'CANCELED') return 'error'
  if (state === 'BUILDING' || state === 'INITIALIZING' || state === 'QUEUED') return 'warning'
  return 'secondary'
}

function stateIcon(state: string) {
  if (state === 'READY') return <CheckCircle2 size={12} className="text-emerald-400" />
  if (state === 'ERROR' || state === 'CANCELED') return <XCircle size={12} className="text-red-400" />
  return <Loader2 size={12} className="text-amber-400 animate-spin" />
}

function relativeTime(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 60) return `${mins}m geleden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}u geleden`
  const days = Math.floor(hours / 24)
  return `${days}d geleden`
}

function formatBuildTime(ms: number | null) {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export default async function VercelPage() {
  const { deployments, domains } = await getData()

  // Latest deployment per project
  const latestByProject: Record<string, any> = {}
  for (const d of deployments) {
    if (!latestByProject[d.project_id]) latestByProject[d.project_id] = d
  }

  // Domains per project
  const domainsByProject: Record<string, any[]> = {}
  for (const d of domains) {
    if (!domainsByProject[d.project_id]) domainsByProject[d.project_id] = []
    domainsByProject[d.project_id].push(d)
  }

  // Stats
  const readyCount = Object.values(latestByProject).filter((d: any) => d.state === 'READY').length
  const errorCount = Object.values(latestByProject).filter((d: any) => d.state === 'ERROR').length
  const buildTimes = deployments.filter((d: any) => d.build_duration_ms).map((d: any) => d.build_duration_ms)
  const avgBuild = buildTimes.length ? Math.round(buildTimes.reduce((a: number, b: number) => a + b, 0) / buildTimes.length) : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Vercel Deployments</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Deployment status, domeinen en build tijden per project</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Live projecten', value: readyCount, color: 'text-emerald-400' },
          { label: 'Fouten', value: errorCount, color: 'text-red-400' },
          { label: 'Totale deploys', value: deployments.length, color: 'text-zinc-400' },
          { label: 'Gem. build tijd', value: formatBuildTime(avgBuild), color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-500 mb-2">{label}</p>
            <p className={`text-2xl font-semibold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Deployment status per project */}
      <div>
        <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <Triangle size={13} />
          Project Status
        </h2>
        <div className="space-y-2">
          {PROJECTS.filter((p) => p.vercelProjectId).map((project) => {
            const latest = latestByProject[project.id]
            const projectDomains = domainsByProject[project.id] ?? []
            const primaryDomain = projectDomains[0]

            return (
              <div
                key={project.id}
                className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                {/* Color dot + name */}
                <div className="flex items-center gap-2 w-36 shrink-0">
                  <span className="w-2 h-2 rounded-full" style={{ background: project.color }} />
                  <span className="text-sm font-medium text-zinc-200">{project.name}</span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5 w-28 shrink-0">
                  {latest ? (
                    <>
                      {stateIcon(latest.state)}
                      <Badge variant={stateVariant(latest.state) as any} className="text-[10px]">
                        {latest.state}
                      </Badge>
                    </>
                  ) : (
                    <span className="text-xs text-zinc-600">Geen data</span>
                  )}
                </div>

                {/* Domain */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {primaryDomain ? (
                    <a
                      href={`https://${primaryDomain.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 truncate"
                    >
                      <Globe size={11} />
                      {primaryDomain.domain}
                    </a>
                  ) : (
                    latest?.url && (
                      <a
                        href={`https://${latest.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 truncate"
                      >
                        <Globe size={11} />
                        {latest.url}
                      </a>
                    )
                  )}
                </div>

                {/* Branch */}
                <div className="w-28 shrink-0">
                  {latest?.branch && (
                    <span className="text-[10px] font-mono text-zinc-500">{latest.branch}</span>
                  )}
                </div>

                {/* Build time */}
                <div className="w-20 shrink-0 text-right">
                  <span className="text-xs font-mono text-zinc-500">
                    {formatBuildTime(latest?.build_duration_ms ?? null)}
                  </span>
                </div>

                {/* Last deployed */}
                <div className="w-24 shrink-0 text-right">
                  <span className="text-xs text-zinc-600">{relativeTime(latest?.deployed_at ?? null)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent deployments table */}
      <div>
        <h2 className="text-sm font-medium text-zinc-300 mb-3">Recente Deployments</h2>
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Project</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Branch</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Build</th>
                <th className="text-right px-4 py-2.5 text-zinc-500 font-medium">Tijd</th>
              </tr>
            </thead>
            <tbody>
              {deployments.slice(0, 30).map((d: any, i: number) => (
                <tr
                  key={d.id}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/20'}`}
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: projectColor(d.project_id) }} />
                      <span className="text-zinc-300">{projectName(d.project_id)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      {stateIcon(d.state)}
                      <span className={d.state === 'READY' ? 'text-emerald-400' : d.state === 'ERROR' ? 'text-red-400' : 'text-amber-400'}>
                        {d.state}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-mono text-zinc-500">{d.branch ?? '—'}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-mono text-zinc-500">{formatBuildTime(d.build_duration_ms)}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-zinc-600">{relativeTime(d.deployed_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Domains per project */}
      {domains.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <Globe size={13} />
            Domeinen
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(domainsByProject).map(([projectId, projectDomains]) => (
              <Card key={projectId}>
                <CardHeader>
                  <CardTitle className="text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: projectColor(projectId) }} />
                    {projectName(projectId)}
                  </CardTitle>
                </CardHeader>
                <div className="px-4 pb-3 space-y-1.5">
                  {projectDomains.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between">
                      <a
                        href={`https://${d.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                      >
                        {d.domain}
                      </a>
                      <div className="flex items-center gap-1.5">
                        {d.is_production && (
                          <Badge variant="success" className="text-[10px]">prod</Badge>
                        )}
                        {d.verified ? (
                          <CheckCircle2 size={11} className="text-emerald-500" />
                        ) : (
                          <XCircle size={11} className="text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

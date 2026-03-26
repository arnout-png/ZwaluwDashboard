import { getSupabaseAdmin } from '@/lib/supabase'
import { PROJECTS } from '@/lib/projects'
import { SERVICES } from '@/lib/services-registry'
import { notFound } from 'next/navigation'
import { ExternalLink, Key, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params
  const service = SERVICES.find((s) => s.id === id)
  if (!service) notFound()

  const supabase = getSupabaseAdmin()

  const [{ data: connections }, { data: costs }, { data: incidents }] = await Promise.all([
    supabase
      .from('service_connections')
      .select('project_id, env_keys')
      .eq('service_id', id),
    supabase
      .from('cost_estimates')
      .select('month, amount_eur, source, plan_name')
      .eq('service_id', id)
      .order('month', { ascending: false })
      .limit(6),
    supabase
      .from('incidents')
      .select('*')
      .eq('service_id', id)
      .order('started_at', { ascending: false })
      .limit(5),
  ])

  const usedByProjects = (connections ?? []).map((c: any) => ({
    project: PROJECTS.find((p) => p.id === c.project_id),
    envKeys: c.env_keys ?? [],
  })).filter((c: any) => c.project)

  const latestCost = costs?.[0]
  const totalEur = (costs ?? []).reduce((sum: number, c: any) => sum + Number(c.amount_eur), 0)
  const avgMonthly = costs?.length ? totalEur / costs.length : 0

  const openIncidents = (incidents ?? []).filter((i: any) => !i.resolved_at)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-white">{service.name}</h1>
            {openIncidents.length > 0 && (
              <Badge variant="error">{openIncidents.length} incident{openIncidents.length > 1 ? 's' : ''}</Badge>
            )}
          </div>
          <p className="text-sm text-zinc-500">{service.provider} · {service.category}</p>
          {service.notes && <p className="text-xs text-zinc-600 mt-1">{service.notes}</p>}
        </div>
        {service.docsUrl && (
          <a
            href={service.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ExternalLink size={12} />
            Documentatie
          </a>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-2">Gebruikt door</p>
          <p className="text-2xl font-semibold text-white">{usedByProjects.length}</p>
          <p className="text-xs text-zinc-600">project{usedByProjects.length !== 1 ? 'en' : ''}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-2">Kosten deze maand</p>
          <p className="text-2xl font-semibold text-white">
            {latestCost ? `€${Number(latestCost.amount_eur).toFixed(2)}` : '—'}
          </p>
          {latestCost && <p className="text-xs text-zinc-600">{latestCost.source === 'api' ? 'via API' : 'schatting'}</p>}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-2">Gem. p/m (6m)</p>
          <p className="text-2xl font-semibold text-white">
            {costs?.length ? `€${avgMonthly.toFixed(2)}` : '—'}
          </p>
          <p className="text-xs text-zinc-600">{costs?.length ?? 0} maanden data</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Projects using this service */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Projecten die deze service gebruiken</CardTitle>
          </CardHeader>
          <div className="px-4 pb-4 space-y-3">
            {usedByProjects.length === 0 ? (
              <p className="text-xs text-zinc-600">Geen projecten gekoppeld</p>
            ) : (
              usedByProjects.map(({ project, envKeys }: any) => (
                <div key={project.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: project.color }} />
                    <span className="text-sm font-medium text-zinc-200">{project.name}</span>
                  </div>
                  {envKeys.length > 0 && (
                    <div className="ml-4 flex flex-wrap gap-1">
                      {envKeys.map((key: string) => (
                        <span
                          key={key}
                          className="flex items-center gap-1 text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded"
                        >
                          <Key size={8} />
                          {key}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Cost history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp size={13} />
              Kosten Historie
            </CardTitle>
          </CardHeader>
          <div className="px-4 pb-4">
            {!costs?.length ? (
              <p className="text-xs text-zinc-600">Geen kostendata beschikbaar</p>
            ) : (
              <div className="space-y-2">
                {costs.map((c: any) => (
                  <div key={c.month} className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-zinc-400">{c.month}</span>
                      {c.plan_name && (
                        <span className="ml-2 text-[10px] text-zinc-600">{c.plan_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">
                        €{Number(c.amount_eur).toFixed(2)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        c.source === 'api'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {c.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Incidents */}
      {incidents && incidents.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Incident Historie</h2>
          <div className="space-y-2">
            {incidents.map((inc: any) => (
              <div key={inc.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={inc.severity === 'critical' || inc.severity === 'high' ? 'error' : 'warning'}
                      className="text-[10px]"
                    >
                      {inc.severity}
                    </Badge>
                    <span className="text-sm font-medium text-zinc-200">{inc.title}</span>
                  </div>
                  {inc.resolved_at ? (
                    <Badge variant="success" className="text-[10px]">Opgelost</Badge>
                  ) : (
                    <Badge variant="error" className="text-[10px]">Open</Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-500">
                  {new Date(inc.started_at).toLocaleDateString('nl-NL')}
                  {inc.resolved_at && ` → ${new Date(inc.resolved_at).toLocaleDateString('nl-NL')}`}
                </p>
                {inc.notes && <p className="text-xs text-zinc-600 mt-1">{inc.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { getSupabaseAdmin } from '@/lib/supabase'
import { PROJECTS } from '@/lib/projects'
import { SERVICES } from '@/lib/services-registry'
import { Plug, Database, Server, Phone, Brain, Megaphone, Mail, Key, Globe, Mic, Map, Image, GitBranch, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  database:   { label: 'Database',      icon: Database,     color: '#22c55e' },
  hosting:    { label: 'Hosting',       icon: Server,       color: '#6366f1' },
  voip:       { label: 'VoIP',          icon: Phone,        color: '#8b5cf6' },
  ai:         { label: 'AI',            icon: Brain,        color: '#f59e0b' },
  'image-gen':{ label: 'Afbeeldingen',  icon: Image,        color: '#ec4899' },
  ads:        { label: 'Advertenties',  icon: Megaphone,    color: '#f97316' },
  email:      { label: 'Email',         icon: Mail,         color: '#14b8a6' },
  auth:       { label: 'Auth',          icon: Key,          color: '#a78bfa' },
  domain:     { label: 'Domeinen',      icon: Globe,        color: '#38bdf8' },
  stt:        { label: 'Spraak→Tekst',  icon: Mic,          color: '#fb923c' },
  maps:       { label: 'Maps',          icon: Map,          color: '#4ade80' },
  vcs:        { label: 'Versiebeheer',  icon: GitBranch,    color: '#94a3b8' },
  comms:      { label: 'Communicatie',  icon: MessageSquare,color: '#818cf8' },
}

async function getData() {
  const { data: connections } = await getSupabaseAdmin()
    .from('service_connections')
    .select('service_id, project_id')
  return { connections: connections ?? [] }
}

export default async function ServicesPage() {
  const { connections } = await getData()

  // Map: serviceId → set of projectIds
  const projectsByService: Record<string, Set<string>> = {}
  for (const conn of connections) {
    if (!projectsByService[conn.service_id]) projectsByService[conn.service_id] = new Set()
    projectsByService[conn.service_id].add(conn.project_id)
  }

  // Group services by category
  const byCategory: Record<string, typeof SERVICES> = {}
  for (const s of SERVICES) {
    if (!byCategory[s.category]) byCategory[s.category] = []
    byCategory[s.category].push(s)
  }

  const categoryOrder = ['database', 'hosting', 'voip', 'ai', 'image-gen', 'ads', 'email', 'auth', 'domain', 'stt', 'maps', 'vcs', 'comms']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Verbonden Services</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Alle {SERVICES.length} externe services en API's die de Zwaluw-infrastructuur gebruiken
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Totaal services', value: SERVICES.length },
          { label: 'Categorieën', value: Object.keys(byCategory).length },
          { label: 'Met cost API', value: SERVICES.filter((s) => s.hasCostApi).length },
          { label: 'Unieke providers', value: new Set(SERVICES.map((s) => s.provider)).size },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-500 mb-2">{label}</p>
            <p className="text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Services grouped by category */}
      <div className="space-y-6">
        {categoryOrder
          .filter((cat) => byCategory[cat]?.length > 0)
          .map((cat) => {
            const meta = CATEGORY_META[cat] ?? { label: cat, icon: Plug, color: '#71717a' }
            const Icon = meta.icon
            const catServices = byCategory[cat]

            return (
              <div key={cat}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2 mb-3">
                  <Icon size={13} style={{ color: meta.color }} />
                  {meta.label}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {catServices.map((service) => {
                    const usedBy = Array.from(projectsByService[service.id] ?? [])
                    return (
                      <Link
                        key={service.id}
                        href={`/services/${service.id}`}
                        className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:bg-zinc-800/60 hover:border-zinc-700 transition-colors group"
                      >
                        {/* Color indicator */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: meta.color + '20' }}
                        >
                          <Icon size={16} style={{ color: meta.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                              {service.name}
                            </p>
                            {service.hasCostApi && (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded shrink-0">
                                cost API
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">{service.provider}</p>
                          {service.notes && (
                            <p className="text-[10px] text-zinc-600 mt-1 truncate">{service.notes}</p>
                          )}

                          {/* Projects that use this */}
                          {usedBy.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {usedBy.map((pid) => {
                                const proj = PROJECTS.find((p) => p.id === pid)
                                if (!proj) return null
                                return (
                                  <span
                                    key={pid}
                                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                    style={{ background: proj.color + '20', color: proj.color }}
                                  >
                                    {proj.name}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

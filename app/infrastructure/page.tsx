import { getSupabaseAdmin } from '@/lib/supabase'
import { PROJECTS } from '@/lib/projects'
import { SERVICES } from '@/lib/services-registry'
import { InfraMap, type InfraNode, type InfraLink } from '@/components/infra/InfraMap'
import { InfraLegend } from '@/components/infra/InfraLegend'
import { Network, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORY_NODE_TYPE: Record<string, InfraNode['type']> = {
  database:    'database',
  hosting:     'hosting',
  voip:        'voip',
  ai:          'ai',
  'image-gen': 'image-gen',
  ads:         'ads',
  email:       'email',
  auth:        'auth',
  domain:      'domain',
  stt:         'stt',
  maps:        'maps',
  vcs:         'vcs',
  comms:       'comms',
}

const SERVICE_COLORS: Record<string, string> = {
  database:    '#22c55e',
  hosting:     '#6366f1',
  voip:        '#8b5cf6',
  ai:          '#f59e0b',
  'image-gen': '#ec4899',
  ads:         '#f97316',
  email:       '#14b8a6',
  auth:        '#a78bfa',
  domain:      '#38bdf8',
  stt:         '#fb923c',
  maps:        '#4ade80',
  vcs:         '#94a3b8',
  comms:       '#818cf8',
}

async function getData() {
  const supabase = getSupabaseAdmin()
  const [{ data: edges }, { data: incidents }] = await Promise.all([
    supabase.from('infra_edges').select('*'),
    supabase.from('incidents').select('service_id, project_id, severity').is('resolved_at', null),
  ])
  return { edges: edges ?? [], incidents: incidents ?? [] }
}

export default async function InfrastructurePage() {
  const { edges, incidents } = await getData()

  const openIncidentServices = new Set(incidents.map((i: any) => i.service_id).filter(Boolean))
  const openIncidentProjects = new Set(incidents.map((i: any) => i.project_id).filter(Boolean))

  // Build node list
  const nodes: InfraNode[] = [
    // Project nodes
    ...PROJECTS.map((p) => ({
      id: p.id,
      label: p.name,
      type: 'project' as const,
      color: p.color,
      notes: p.description,
    })),
    // Service nodes
    ...SERVICES.map((s) => ({
      id: s.id,
      label: s.name,
      type: (CATEGORY_NODE_TYPE[s.category] ?? 'service') as InfraNode['type'],
      color: SERVICE_COLORS[s.category] ?? '#71717a',
      docsUrl: s.docsUrl,
      notes: s.notes,
    })),
  ]

  // Build link list from Supabase edges
  const links: InfraLink[] = edges.map((e: any) => ({
    source: e.from_id,
    target: e.to_id,
    edgeType: e.edge_type as InfraLink['edgeType'],
    label: e.label ?? undefined,
  }))

  const crossDbEdges = links.filter((l) => l.edgeType === 'cross-db')
  const totalEdges = links.length

  // Compute infrastructure health score (0-100)
  let score = 100
  if (crossDbEdges.length > 0) score -= crossDbEdges.length * 10 // each cross-db dependency
  score -= incidents.filter((i: any) => i.severity === 'critical').length * 20
  score -= incidents.filter((i: any) => i.severity === 'high').length * 10
  score -= incidents.filter((i: any) => i.severity === 'medium').length * 5
  score = Math.max(0, Math.min(100, score))

  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Network size={18} />
            Infrastructuur Map
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {nodes.length} knooppunten · {totalEdges} verbindingen · {PROJECTS.length} projecten · {SERVICES.length} services
          </p>
        </div>

        {/* Health score */}
        <div className="flex items-center gap-4">
          {crossDbEdges.length > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400 text-sm">
              <AlertTriangle size={14} />
              <span>{crossDbEdges.length} cross-DB afhankelijkheid{crossDbEdges.length > 1 ? 'en' : ''}</span>
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Infra Score</p>
            <p className="text-2xl font-semibold font-mono" style={{ color: scoreColor }}>
              {score}
            </p>
          </div>
        </div>
      </div>

      {/* Map — fills remaining height */}
      <div className="flex-1 overflow-hidden bg-zinc-950 relative">
        <InfraMap nodes={nodes} links={links} />
      </div>

      {/* Legend bar */}
      <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950 shrink-0">
        <InfraLegend />
      </div>
    </div>
  )
}

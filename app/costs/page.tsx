'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SERVICES } from '@/lib/services-registry'
import { PROJECTS } from '@/lib/projects'
import { SERVICE_CONNECTIONS } from '@/lib/services-registry'
import { CircleDollarSign, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'

type CostRow = {
  service_id: string
  month: string
  amount_eur: number
  source: string
  plan_name: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
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

export default function CostsPage() {
  const [costs, setCosts] = useState<CostRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('cost_estimates')
      .select('*')
      .order('month', { ascending: false })
      .then(({ data }) => {
        setCosts(data ?? [])
        setLoading(false)
      })
  }, [])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 7)

  const currentCosts = costs.filter((c) => c.month === currentMonth)
  const lastCosts = costs.filter((c) => c.month === lastMonth)

  const totalCurrent = currentCosts.reduce((s, c) => s + Number(c.amount_eur), 0)
  const totalLast = lastCosts.reduce((s, c) => s + Number(c.amount_eur), 0)
  const delta = totalCurrent - totalLast

  // Group by category for chart
  const byCat: Record<string, number> = {}
  for (const row of currentCosts) {
    const service = SERVICES.find((s) => s.id === row.service_id)
    if (!service) continue
    byCat[service.category] = (byCat[service.category] ?? 0) + Number(row.amount_eur)
  }
  const catEntries = Object.entries(byCat)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)

  // Per project cost (sum of services used)
  const byProject: Record<string, number> = {}
  for (const row of currentCosts) {
    const conns = SERVICE_CONNECTIONS.filter((c) => c.serviceId === row.service_id)
    for (const conn of conns) {
      byProject[conn.projectId] = (byProject[conn.projectId] ?? 0) + Number(row.amount_eur) / conns.length
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Kostenoverzicht</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Maandelijkse servicekosten per categorie en project</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-2">Totaal deze maand</p>
          <p className="text-3xl font-semibold text-white">€{totalCurrent.toFixed(2)}</p>
          <p className="text-xs text-zinc-600 mt-1">{currentMonth}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-2">Vorige maand</p>
          <p className="text-3xl font-semibold text-zinc-400">€{totalLast.toFixed(2)}</p>
          <p className="text-xs text-zinc-600 mt-1">{lastMonth}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-2">Verschil</p>
          <div className="flex items-center gap-2">
            {delta > 0
              ? <TrendingUp size={18} className="text-red-400" />
              : <TrendingDown size={18} className="text-emerald-400" />
            }
            <p className={`text-3xl font-semibold ${delta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {delta >= 0 ? '+' : ''}€{delta.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Category breakdown bar chart */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">Per Categorie</h2>
          {catEntries.length === 0 ? (
            <p className="text-xs text-zinc-600">Geen kostendata voor deze maand</p>
          ) : (
            <div className="space-y-3">
              {catEntries.map(([cat, amount]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-400 capitalize">{cat}</span>
                    <span className="text-xs font-mono text-zinc-300">€{amount.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${totalCurrent > 0 ? (amount / totalCurrent) * 100 : 0}%`,
                        background: CATEGORY_COLORS[cat] ?? '#71717a',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per project */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">Per Project</h2>
          {Object.keys(byProject).length === 0 ? (
            <p className="text-xs text-zinc-600">Geen data</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byProject)
                .sort(([, a], [, b]) => b - a)
                .map(([pid, amount]) => {
                  const project = PROJECTS.find((p) => p.id === pid)
                  if (!project) return null
                  return (
                    <div key={pid}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: project.color }} />
                          <span className="text-xs text-zinc-400">{project.name}</span>
                        </div>
                        <span className="text-xs font-mono text-zinc-300">€{amount.toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${totalCurrent > 0 ? (amount / totalCurrent) * 100 : 0}%`,
                            background: project.color,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Full cost table */}
      <div>
        <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <ArrowUpDown size={13} />
          Alle Services ({currentMonth})
        </h2>
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Service</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Categorie</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Plan</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Bron</th>
                <th className="text-right px-4 py-2.5 text-zinc-500 font-medium">Per maand</th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((service, i) => {
                const cost = currentCosts.find((c) => c.service_id === service.id)
                const amount = cost ? Number(cost.amount_eur) : 0
                const catColor = CATEGORY_COLORS[service.category] ?? '#71717a'
                return (
                  <tr
                    key={service.id}
                    className={`border-b border-zinc-800/50 ${i % 2 === 0 ? '' : 'bg-zinc-900/20'}`}
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-zinc-200">{service.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                        style={{ background: catColor + '20', color: catColor }}
                      >
                        {service.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500">
                      {cost?.plan_name ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {cost ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          cost.source === 'api'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {cost.source}
                        </span>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-mono font-medium ${amount > 0 ? 'text-zinc-200' : 'text-zinc-600'}`}>
                        {amount > 0 ? `€${amount.toFixed(2)}` : '€0,00'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {/* Total row */}
              <tr className="bg-zinc-900/60 border-t-2 border-zinc-700">
                <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-zinc-300">Totaal</td>
                <td className="px-4 py-3 text-right text-sm font-semibold font-mono text-white">
                  €{totalCurrent.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

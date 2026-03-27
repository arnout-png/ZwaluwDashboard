'use client'

import { useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'

type CollapsibleSummaryProps = {
  summary: {
    goal?: string
    business_value?: string
    key_insight?: string
    status?: string
    maturity?: number
  } | null
  commitAnalysis: {
    summary?: string
    key_changes?: Array<{ area: string; description: string; impact: string }>
  } | null
  color: string
}

export function CollapsibleSummary({ summary, commitAnalysis, color }: CollapsibleSummaryProps) {
  const [open, setOpen] = useState(false)

  const hasContent = summary || commitAnalysis?.summary
  if (!hasContent) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-zinc-800/50"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-white">AI Samenvatting</span>
          {summary?.status && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor:
                  summary.status === 'active' ? '#22c55e18' :
                  summary.status === 'maintenance' ? '#eab30818' :
                  '#71717a18',
                color:
                  summary.status === 'active' ? '#22c55e' :
                  summary.status === 'maintenance' ? '#eab308' :
                  '#71717a',
              }}
            >
              {summary.status}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-5 py-4 space-y-4">
          {/* Project AI summary */}
          {summary && (
            <div className="space-y-3">
              {summary.goal && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Doel</p>
                  <p className="text-sm text-zinc-300">{summary.goal}</p>
                </div>
              )}
              {summary.business_value && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Bedrijfswaarde</p>
                  <p className="text-sm text-zinc-300">{summary.business_value}</p>
                </div>
              )}
              {summary.key_insight && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Inzicht</p>
                  <p className="text-sm text-zinc-300">{summary.key_insight}</p>
                </div>
              )}
              {summary.maturity && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Volwassenheid ({summary.maturity}/5)
                  </p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i <= summary.maturity! ? '' : 'bg-zinc-700'}`}
                        style={i <= summary.maturity! ? { backgroundColor: color } : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Commit analysis summary */}
          {commitAnalysis?.summary && (
            <div className="border-t border-zinc-800 pt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Recente veranderingen</p>
              <p className="text-sm text-zinc-300">{commitAnalysis.summary}</p>
              {commitAnalysis.key_changes && commitAnalysis.key_changes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {commitAnalysis.key_changes.map((c, i) => (
                    <span
                      key={i}
                      className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                    >
                      {c.area}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!summary && !commitAnalysis?.summary && (
            <p className="text-sm text-zinc-500 italic">
              Nog geen AI-analyse beschikbaar. Voer een sync uit om analyses te genereren.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

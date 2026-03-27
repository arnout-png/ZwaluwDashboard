'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { RANGE_OPTIONS } from '@/lib/date-utils'

export function DateRangeSelector() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeRange = searchParams.get('range') || '30d'

  function handleSelect(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', key)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="inline-flex items-center gap-1">
      {RANGE_OPTIONS.map((opt) => {
        const isActive = activeRange === opt.key
        return (
          <button
            key={opt.key}
            onClick={() => handleSelect(opt.key)}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
              isActive
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                : 'bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700'
            }`}
          >
            {opt.shortLabel}
          </button>
        )
      })}
    </div>
  )
}

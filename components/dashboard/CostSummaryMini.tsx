import Link from 'next/link'

type CostItem = {
  serviceName: string
  amountEur: number
  source: string
}

export function CostSummaryMini({
  costs,
  totalEur,
  deltaPercent,
}: {
  costs: CostItem[]
  totalEur: number
  deltaPercent: number | null
}) {
  const top5 = [...costs].sort((a, b) => b.amountEur - a.amountEur).slice(0, 5)
  const maxCost = top5.length > 0 ? top5[0].amountEur : 1

  return (
    <div className="flex flex-col gap-4">
      {/* Total + delta */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-white">
          &euro;{Math.round(totalEur)}
        </span>
        {deltaPercent !== null && (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              deltaPercent >= 0
                ? 'bg-emerald-400/15 text-emerald-400'
                : 'bg-red-400/15 text-red-400'
            }`}
          >
            {deltaPercent >= 0 ? '+' : ''}
            {deltaPercent}%
          </span>
        )}
      </div>

      {/* Top 5 rows */}
      <div className="flex flex-col gap-3">
        {top5.map((item) => {
          const widthPercent = (item.amountEur / maxCost) * 100
          return (
            <div key={item.serviceName}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{item.serviceName}</span>
                <span className="text-sm font-mono text-zinc-300">
                  &euro;{item.amountEur.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-zinc-800">
                <div
                  className="h-1 rounded-full bg-cyan-500"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer link */}
      <Link
        href="/costs"
        className="mt-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        Bekijk alle kosten &rarr;
      </Link>
    </div>
  )
}

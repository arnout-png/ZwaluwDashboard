type MetricsGridProps = {
  metrics: {
    commitConsistencyScore: number
    deploySuccessRate: number
    avgBuildTimeMs: number
    activeContributors: number
    codeChurnRate: number
    avgCommitSize: number
  } | null
  color: string
}

export function MetricsGrid({ metrics, color }: MetricsGridProps) {
  if (!metrics) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="text-sm text-zinc-500">
          Geen metrics beschikbaar. Voer een sync uit.
        </p>
      </div>
    )
  }

  const cards = [
    {
      label: 'Commit-consistentie',
      value: `${Math.round(metrics.commitConsistencyScore)}/100`,
      bar: metrics.commitConsistencyScore,
    },
    {
      label: 'Deploy-succesrate',
      value: `${Math.round(metrics.deploySuccessRate * 100)}%`,
      bar: metrics.deploySuccessRate * 100,
    },
    {
      label: 'Gem. build-tijd',
      value: `${(metrics.avgBuildTimeMs / 1000).toFixed(1)}s`,
      bar: null,
    },
    {
      label: 'Actieve contributors',
      value: `${metrics.activeContributors}`,
      bar: null,
    },
    {
      label: 'Code-churn',
      value: `${Math.round(metrics.codeChurnRate * 100)}%`,
      bar: metrics.codeChurnRate * 100,
    },
    {
      label: 'Gem. commit grootte',
      value: `${Math.round(metrics.avgCommitSize)} regels`,
      bar: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
        >
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            {card.label}
          </p>
          <p className="mt-1 text-lg font-bold text-white">{card.value}</p>
          {card.bar !== null && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(card.bar, 100)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

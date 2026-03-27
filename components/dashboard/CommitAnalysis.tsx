const impactStyles = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-emerald-500/20 text-emerald-400',
} as const

type CommitAnalysisProps = {
  analysis: {
    summary: string
    key_changes: Array<{
      area: string
      description: string
      impact: 'high' | 'medium' | 'low'
    }>
    patterns: string[]
  } | null
  color: string
}

export function CommitAnalysis({ analysis, color }: CommitAnalysisProps) {
  if (!analysis) return null

  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-sm text-zinc-300 leading-relaxed">
        {analysis.summary}
      </p>

      {/* Key Changes */}
      {analysis.key_changes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Belangrijkste wijzigingen
          </h4>
          <ul className="space-y-2">
            {analysis.key_changes.map((change, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-zinc-400"
              >
                <span className="shrink-0 rounded bg-zinc-700 text-zinc-300 text-[10px] px-2 py-0.5 mt-0.5">
                  {change.area}
                </span>
                <span className="flex-1">{change.description}</span>
                <span
                  className={`shrink-0 rounded text-[10px] px-2 py-0.5 font-medium ${impactStyles[change.impact]}`}
                >
                  {change.impact}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Patterns */}
      {analysis.patterns.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Patronen
          </h4>
          <ul className="space-y-1">
            {analysis.patterns.map((pattern, i) => (
              <li
                key={i}
                className="text-sm italic text-zinc-500"
              >
                {pattern}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

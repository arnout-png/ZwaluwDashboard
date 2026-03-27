const GRADE_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
  Gepland: '#71717a',
}

const RANK_COLORS: Record<number, string> = {
  1: 'text-amber-400',
  2: 'text-zinc-400',
  3: 'text-orange-400',
}

type LeaderboardItem = {
  id: string
  name: string
  color: string
  score: number
  grade: string
}

export function QualityLeaderboard({ items }: { items: LeaderboardItem[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item, index) => {
        const rank = index + 1
        const gradeColor = GRADE_COLORS[item.grade] ?? '#71717a'
        const isTopThree = rank <= 3

        return (
          <div key={item.id} className="flex items-center gap-3">
            {/* Rank */}
            <span
              className={`w-6 text-right text-xs ${isTopThree ? `font-bold ${RANK_COLORS[rank]}` : 'text-zinc-600'}`}
            >
              #{rank}
            </span>

            {/* Color dot */}
            <div
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />

            {/* Name */}
            <span className="min-w-[100px] text-sm text-zinc-300">{item.name}</span>

            {/* Score bar */}
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${item.score}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>

            {/* Grade badge */}
            <div
              className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
              style={{
                backgroundColor: gradeColor + '18',
                color: gradeColor,
              }}
            >
              {item.grade}
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import type { QualityResult } from '@/lib/quality-score'

const GRADE_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
}

/** Radial gauge (180° arc) showing quality score 0–100 + letter grade */
export function QualityGauge({
  result,
  size = 160,
}: {
  result: QualityResult
  size?: number
}) {
  const { score, grade, dimensions } = result
  const color = GRADE_COLORS[grade] ?? '#71717a'

  // SVG arc math — 180° semicircle
  const r = 54
  const cx = 64
  const cy = 64
  const strokeWidth = 10
  const circumference = Math.PI * r // half circle
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Gauge */}
      <div className="relative" style={{ width: size, height: size * 0.6 }}>
        <svg
          viewBox="0 0 128 72"
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        >
          {/* Background arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#27272a"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span
            className="text-3xl font-bold"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-xs text-zinc-500 -mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Grade badge */}
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1"
        style={{ backgroundColor: color + '18' }}
      >
        <span className="text-sm font-bold" style={{ color }}>
          Grade {grade}
        </span>
      </div>
    </div>
  )
}

/** Horizontal bar breakdown of quality dimensions */
export function QualityBreakdown({
  dimensions,
  color,
}: {
  dimensions: QualityResult['dimensions']
  color: string
}) {
  return (
    <div className="space-y-3">
      {dimensions.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-zinc-400">{d.label}</span>
            <span className="text-zinc-500">
              {d.score}
              <span className="text-zinc-600">/{100}</span>
              <span className="ml-1 text-zinc-700">({d.weight}%)</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${d.score}%`,
                backgroundColor: color,
                opacity: 0.6 + (d.score / 100) * 0.4,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Compact inline score for cards — just the number + colored dot */
export function QualityBadge({ result }: { result: QualityResult }) {
  const color = GRADE_COLORS[result.grade] ?? '#71717a'
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-medium" style={{ color }}>
        {result.score}
      </span>
    </div>
  )
}

'use client'

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

export function Sparkline({
  data,
  color,
}: {
  data: { date: string; count: number }[]
  color: string
}) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          contentStyle={{
            background: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#a1a1aa',
          }}
          itemStyle={{ color: '#fff' }}
          formatter={(v: number) => [v, 'commits']}
          labelFormatter={(label) => label}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

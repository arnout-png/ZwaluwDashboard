'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type DataPoint = Record<string, number | string>

export function CommitChart({
  data,
  projects,
}: {
  data: DataPoint[]
  projects: { id: string; name: string; color: string }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => v.slice(5)} // MM-DD
          interval={6}
        />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          itemStyle={{ color: '#e4e4e7' }}
          labelStyle={{ color: '#a1a1aa', marginBottom: 4 }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: '#a1a1aa', paddingTop: 12 }}
        />
        {projects.map((p) => (
          <Line
            key={p.id}
            type="monotone"
            dataKey={p.id}
            name={p.name}
            stroke={p.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

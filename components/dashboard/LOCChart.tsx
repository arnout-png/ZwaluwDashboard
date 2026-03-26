'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

// Rough conversion: ~50 bytes per line for most languages
const BYTES_PER_LINE = 50

export function LOCChart({
  data,
}: {
  data: { id: string; name: string; color: string; totalBytes: number }[]
}) {
  const chartData = data
    .filter((d) => d.totalBytes > 0)
    .map((d) => ({
      name: d.name,
      color: d.color,
      loc: Math.round(d.totalBytes / BYTES_PER_LINE),
    }))
    .sort((a, b) => b.loc - a.loc)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
        />
        <Tooltip
          contentStyle={{
            background: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          itemStyle={{ color: '#e4e4e7' }}
          formatter={(v: number) => [`~${v.toLocaleString('nl')} regels`, 'Geschatte LOC']}
        />
        <Bar dataKey="loc" radius={[4, 4, 0, 0]} maxBarSize={60}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

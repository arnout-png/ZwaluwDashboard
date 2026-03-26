const EDGE_LEGEND = [
  { type: 'deploys-to', color: '#6366f1', dash: '6 3', label: 'Deployment' },
  { type: 'reads',      color: '#3b82f6', dash: '0',   label: 'Leest van' },
  { type: 'writes',     color: '#10b981', dash: '0',   label: 'Schrijft naar' },
  { type: 'calls',      color: '#8b5cf6', dash: '4 2', label: 'API aanroep' },
  { type: 'cross-db',   color: '#f59e0b', dash: '0',   label: 'Cross-DB ⚠️' },
  { type: 'auth',       color: '#ec4899', dash: '3 3', label: 'Authenticatie' },
  { type: 'webhook',    color: '#14b8a6', dash: '3 3', label: 'Webhook' },
]

const NODE_LEGEND = [
  { label: 'Project',   color: '#06b6d4' },
  { label: 'Database',  color: '#22c55e' },
  { label: 'Hosting',   color: '#6366f1' },
  { label: 'VoIP',      color: '#8b5cf6' },
  { label: 'AI',        color: '#f59e0b' },
  { label: 'Service',   color: '#71717a' },
]

export function InfraLegend() {
  return (
    <div className="flex flex-wrap gap-6 text-xs text-zinc-500">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">Knooppunten</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {NODE_LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border" style={{ borderColor: color, background: color + '25' }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">Verbindingen</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {EDGE_LEGEND.map(({ type, color, dash, label }) => (
            <div key={type} className="flex items-center gap-1.5">
              <svg width="24" height="10">
                <line
                  x1="0" y1="5" x2="24" y2="5"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray={dash}
                />
              </svg>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

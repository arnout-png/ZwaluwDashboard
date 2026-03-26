'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ExternalLink } from 'lucide-react'

export type InfraNode = {
  id: string
  label: string
  type: 'project' | 'database' | 'hosting' | 'voip' | 'ai' | 'image-gen' | 'ads' | 'email' | 'auth' | 'domain' | 'stt' | 'maps' | 'vcs' | 'comms' | 'service'
  color: string
  docsUrl?: string
  notes?: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export type InfraLink = {
  source: string
  target: string
  edgeType: 'reads' | 'writes' | 'calls' | 'deploys-to' | 'cross-db' | 'auth' | 'webhook'
  label?: string
}

type SimNode = InfraNode & { x: number; y: number; vx: number; vy: number }
type SimLink = { source: SimNode; target: SimNode; edgeType: string; label?: string }

const EDGE_COLORS: Record<string, string> = {
  'deploys-to': '#6366f1',
  reads:        '#3b82f6',
  writes:       '#10b981',
  calls:        '#8b5cf6',
  'cross-db':   '#f59e0b',
  auth:         '#ec4899',
  webhook:      '#14b8a6',
}

const EDGE_DASH: Record<string, string> = {
  'deploys-to': '6 3',
  reads:        '0',
  writes:       '0',
  calls:        '4 2',
  'cross-db':   '0',
  auth:         '3 3',
  webhook:      '3 3',
}

const NODE_RADIUS: Record<string, number> = {
  project:   32,
  database:  22,
  hosting:   20,
  voip:      18,
  ai:        18,
  'image-gen':18,
  ads:       18,
  email:     18,
  auth:      18,
  domain:    18,
  stt:       18,
  maps:      18,
  vcs:       18,
  comms:     18,
  service:   16,
}

// Simple force-directed layout in pure TS (no external library needed at this scale)
function runForceSimulation(
  nodes: SimNode[],
  links: { source: string; target: string }[],
  width: number,
  height: number,
  iterations = 300
) {
  const cx = width / 2
  const cy = height / 2
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // Initialize positions in rings
  const projects = nodes.filter((n) => n.type === 'project')
  const databases = nodes.filter((n) => n.type === 'database')
  const others = nodes.filter((n) => n.type !== 'project' && n.type !== 'database')

  projects.forEach((n, i) => {
    const angle = (i / Math.max(projects.length, 1)) * Math.PI * 2
    n.x = cx + Math.cos(angle) * 160
    n.y = cy + Math.sin(angle) * 130
    n.vx = 0; n.vy = 0
  })
  databases.forEach((n, i) => {
    const angle = (i / Math.max(databases.length, 1)) * Math.PI * 2 + 0.3
    n.x = cx + Math.cos(angle) * 270
    n.y = cy + Math.sin(angle) * 230
    n.vx = 0; n.vy = 0
  })
  others.forEach((n, i) => {
    const angle = (i / Math.max(others.length, 1)) * Math.PI * 2 + 0.5
    n.x = cx + Math.cos(angle) * 390
    n.y = cy + Math.sin(angle) * 310
    n.vx = 0; n.vy = 0
  })

  const resolvedLinks = links
    .map((l) => ({ source: nodeMap.get(l.source), target: nodeMap.get(l.target) }))
    .filter((l): l is { source: SimNode; target: SimNode } => !!l.source && !!l.target)

  const alpha = { value: 1.0 }

  for (let iter = 0; iter < iterations; iter++) {
    const a = alpha.value

    // Link forces
    for (const link of resolvedLinks) {
      const dx = link.target.x - link.source.x
      const dy = link.target.y - link.source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const targetDist = (NODE_RADIUS[link.source.type] ?? 18) + (NODE_RADIUS[link.target.type] ?? 18) + 80
      const strength = ((dist - targetDist) / dist) * 0.3 * a
      link.source.vx += dx * strength
      link.source.vy += dy * strength
      link.target.vx -= dx * strength
      link.target.vy -= dy * strength
    }

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i], nj = nodes[j]
        const dx = nj.x - ni.x
        const dy = nj.y - ni.y
        const dist2 = dx * dx + dy * dy + 0.001
        const minDist = (NODE_RADIUS[ni.type] ?? 18) + (NODE_RADIUS[nj.type] ?? 18) + 60
        if (dist2 < minDist * minDist) {
          const dist = Math.sqrt(dist2)
          const f = ((minDist - dist) / dist) * 0.5 * a
          ni.vx -= dx * f; ni.vy -= dy * f
          nj.vx += dx * f; nj.vy += dy * f
        }
      }
    }

    // Center gravity
    for (const n of nodes) {
      if (n.type === 'project') {
        n.vx += (cx - n.x) * 0.015 * a
        n.vy += (cy - n.y) * 0.01 * a
      }
    }

    // Integrate + dampen
    for (const n of nodes) {
      n.vx *= 0.85
      n.vy *= 0.85
      n.x += n.vx
      n.y += n.vy
      n.x = Math.max(50, Math.min(width - 50, n.x))
      n.y = Math.max(50, Math.min(height - 50, n.y))
    }

    alpha.value *= 0.97
  }

  return nodes
}

type Props = {
  nodes: InfraNode[]
  links: InfraLink[]
}

export function InfraMap({ nodes: initialNodes, links }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 900, h: 600 })
  const [simNodes, setSimNodes] = useState<SimNode[]>([])
  const [simLinks, setSimLinks] = useState<SimLink[]>([])
  const [selected, setSelected] = useState<SimNode | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const w = width || 900
    const h = height || 600
    setSize({ w, h })

    const nodes: SimNode[] = initialNodes.map((n) => ({
      ...n,
      x: w / 2 + Math.random() * 40 - 20,
      y: h / 2 + Math.random() * 40 - 20,
      vx: 0,
      vy: 0,
    }))

    const computed = runForceSimulation(nodes, links.map((l) => ({ source: l.source, target: l.target })), w, h, 400)
    setSimNodes([...computed])

    const nodeMap = new Map(computed.map((n) => [n.id, n]))
    const resolved = links
      .map((l) => ({
        source: nodeMap.get(l.source)!,
        target: nodeMap.get(l.target)!,
        edgeType: l.edgeType,
        label: l.label,
      }))
      .filter((l) => l.source && l.target)
    setSimLinks(resolved)
  }, [initialNodes, links])

  const handleNodeClick = useCallback((node: SimNode, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelected((prev) => (prev?.id === node.id ? null : node))
  }, [])

  const connectedLinks = selected
    ? simLinks.filter((l) => l.source.id === selected.id || l.target.id === selected.id)
    : []

  const connectedNodeIds = new Set(connectedLinks.flatMap((l) => [l.source.id, l.target.id]))

  return (
    <div className="relative flex gap-0 h-full">
      {/* SVG canvas */}
      <div ref={containerRef} className="flex-1 relative" style={{ minHeight: 500 }}>
        <svg
          width={size.w}
          height={size.h}
          className="w-full h-full"
          onClick={() => setSelected(null)}
        >
          {/* Arrow markers */}
          <defs>
            {Object.entries(EDGE_COLORS).map(([type, color]) => (
              <marker
                key={type}
                id={`arrow-${type}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
              </marker>
            ))}
          </defs>

          {/* Edges */}
          {simLinks.map((link, i) => {
            const dx = link.target.x - link.source.x
            const dy = link.target.y - link.source.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const srcR = NODE_RADIUS[link.source.type] ?? 18
            const tgtR = NODE_RADIUS[link.target.type] ?? 18
            const x1 = link.source.x + (dx / dist) * srcR
            const y1 = link.source.y + (dy / dist) * srcR
            const x2 = link.target.x - (dx / dist) * (tgtR + 6)
            const y2 = link.target.y - (dy / dist) * (tgtR + 6)
            const color = EDGE_COLORS[link.edgeType] ?? '#71717a'
            const dash = EDGE_DASH[link.edgeType] ?? '0'
            const isCrossDb = link.edgeType === 'cross-db'
            const edgeId = `edge-${i}`
            const isHovered = hoveredEdge === edgeId
            const isSelected = selected && (link.source.id === selected.id || link.target.id === selected.id)
            const isDimmed = selected && !connectedNodeIds.has(link.source.id) && !connectedNodeIds.has(link.target.id)

            return (
              <g key={i}>
                {/* Wider invisible hit area */}
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="transparent"
                  strokeWidth={12}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredEdge(edgeId)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color}
                  strokeWidth={isCrossDb ? 2.5 : isSelected ? 2 : 1}
                  strokeDasharray={dash}
                  opacity={isDimmed ? 0.12 : isCrossDb ? 0.9 : isHovered || isSelected ? 0.8 : 0.3}
                  markerEnd={`url(#arrow-${link.edgeType})`}
                  style={{ transition: 'opacity 0.15s' }}
                />
                {/* Label on cross-db edges or on hover */}
                {(isCrossDb || (isHovered && link.label)) && link.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 6}
                    textAnchor="middle"
                    fill={color}
                    fontSize={9}
                    className="pointer-events-none"
                    style={{ fontFamily: 'var(--font-geist-mono)' }}
                  >
                    {link.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {simNodes.map((node) => {
            const r = NODE_RADIUS[node.type] ?? 18
            const isSelected = selected?.id === node.id
            const isDimmed = selected && !connectedNodeIds.has(node.id) && selected.id !== node.id
            const letter = node.label.charAt(0).toUpperCase()

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                opacity={isDimmed ? 0.2 : 1}
                onClick={(e) => handleNodeClick(node, e)}
              >
                {/* Glow ring when selected */}
                {isSelected && (
                  <circle r={r + 6} fill="none" stroke={node.color} strokeWidth={1.5} opacity={0.4} />
                )}
                {/* Main circle */}
                <circle
                  r={r}
                  fill={node.color + '25'}
                  stroke={node.color}
                  strokeWidth={isSelected ? 2 : 1.2}
                />
                {/* Initials */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={node.color}
                  fontSize={node.type === 'project' ? 12 : 10}
                  fontWeight="600"
                  className="pointer-events-none select-none"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {letter}
                </text>
                {/* Label below */}
                <text
                  y={r + 13}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  fontSize={9.5}
                  className="pointer-events-none select-none"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-64 border-l border-zinc-800 bg-zinc-950 p-4 overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: selected.color }} />
              <h3 className="text-sm font-semibold text-white truncate">{selected.label}</h3>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1 mb-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{selected.type}</p>
            {selected.notes && <p className="text-xs text-zinc-500">{selected.notes}</p>}
            {selected.docsUrl && (
              <a
                href={selected.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
              >
                <ExternalLink size={10} /> Documentatie
              </a>
            )}
          </div>

          {connectedLinks.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Verbindingen ({connectedLinks.length})</p>
              <div className="space-y-1.5">
                {connectedLinks.map((link, i) => {
                  const isOutgoing = link.source.id === selected.id
                  const other = isOutgoing ? link.target : link.source
                  const color = EDGE_COLORS[link.edgeType] ?? '#71717a'
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
                        style={{ background: color + '20', color }}
                      >
                        {isOutgoing ? '→' : '←'} {link.edgeType}
                      </span>
                      <span
                        className="truncate text-zinc-400"
                        style={{ color: other.color }}
                      >
                        {other.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

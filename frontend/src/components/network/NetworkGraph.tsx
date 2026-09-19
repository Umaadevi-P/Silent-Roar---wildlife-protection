import { useEffect, useRef, useState } from 'react'
import { GraphEdge, GraphNode } from '../../types'
import { cx } from '../../utils/format'
import { Users, FileWarning, MapPin, Waypoints, FileStack, MessageSquareText } from 'lucide-react'

const NODE_COLOR: Record<string, string> = {
  ACTOR:    '#C4433D',
  INCIDENT: '#D19A3E',
  LOCATION: '#3E9AB0',
  ROUTE:    '#149447',
  EVIDENCE: '#8E9895',
  SHIPMENT: '#3E9AB0',
  MESSAGE:  '#5FC886',
}

const NODE_LABEL: Record<string, string> = {
  ACTOR:    'Actor',
  INCIDENT: 'Incident',
  LOCATION: 'Location',
  ROUTE:    'Route',
  EVIDENCE: 'Evidence',
  SHIPMENT: 'Shipment',
  MESSAGE:  'Message',
}

const typeIconMap: Record<string, typeof Users> = {
  ACTOR:    Users,
  INCIDENT: FileWarning,
  LOCATION: MapPin,
  ROUTE:    Waypoints,
  EVIDENCE: FileStack,
  SHIPMENT: FileStack,
  MESSAGE:  MessageSquareText,
}

export function NetworkGraph({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
  height = 480,
}: {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  selectedNodeId?: string | null
  height?: number
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: height })

  // Measure actual container pixels so we can map % coordinates correctly
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const visibleNodes = nodes.filter((n) => n.x !== undefined && n.y !== undefined)
  const visibleEdges = edges.filter((e) => {
    const s = nodes.find((n) => n.id === e.source)
    const t = nodes.find((n) => n.id === e.target)
    return s?.x !== undefined && t?.x !== undefined
  })

  // Convert % coordinates to pixels
  const px = (x: number) => (x / 100) * size.w
  const py = (y: number) => (y / 100) * size.h
  const nodeById = (id: string) => visibleNodes.find((n) => n.id === id)

  if (visibleNodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[14px] text-slate-400 animate-fade-in"
        style={{ height }}
      >
        No network data to display.
      </div>
    )
  }

  const NODE_R = 8       // base radius in pixels
  const ACTIVE_R = 13    // radius when hovered/selected

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAF9] shadow-sm"
      style={{ height }}
    >
      <svg
        width={size.w}
        height={size.h}
        className="absolute inset-0 block"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <pattern id="netgrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="#E8EDE9" strokeWidth="0.5" />
          </pattern>
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={size.w} height={size.h} fill="url(#netgrid)" />

        {/* Edges */}
        {visibleEdges.map((edge) => {
          const s = nodeById(edge.source)!
          const t = nodeById(edge.target)!
          const isHighlighted =
            hoveredId === s.id || hoveredId === t.id ||
            selectedNodeId === s.id || selectedNodeId === t.id
          return (
            <line
              key={edge.id}
              x1={px(s.x!)} y1={py(s.y!)}
              x2={px(t.x!)} y2={py(t.y!)}
              stroke={isHighlighted ? '#0F7A3A' : '#CBD5CE'}
              strokeWidth={isHighlighted ? 1.8 : 1}
              opacity={isHighlighted ? 0.9 : 0.45}
              filter={isHighlighted ? 'url(#edge-glow)' : undefined}
              strokeDasharray={isHighlighted ? undefined : '4 3'}
              style={{ transition: 'stroke 0.2s, opacity 0.2s, stroke-width 0.2s' }}
            />
          )
        })}
      </svg>

      {/* Nodes — absolutely positioned using pixel coordinates */}
      {visibleNodes.map((node) => {
        const color = NODE_COLOR[node.type] ?? '#8E9895'
        const Icon = typeIconMap[node.type] ?? FileStack
        const isSelected = selectedNodeId === node.id
        const isHovered = hoveredId === node.id
        const active = isSelected || isHovered
        const r = active ? ACTIVE_R : NODE_R
        const cx_ = px(node.x!)
        const cy_ = py(node.y!)

        return (
          <button
            key={node.id}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onNodeClick?.(node)}
            className="focus-ring absolute outline-none"
            style={{
              left: cx_,
              top: cy_,
              transform: 'translate(-50%, -50%)',
              zIndex: active ? 20 : 10,
            }}
          >
            {/* Pulse ring for active nodes */}
            {active && (
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{
                  backgroundColor: color,
                  width: r * 2 + 8,
                  height: r * 2 + 8,
                  top: -(r + 4) + r,
                  left: -(r + 4) + r,
                }}
              />
            )}

            {/* Node circle */}
            <span
              className={cx(
                'relative flex items-center justify-center rounded-full border-2 border-white shadow-md',
                'transition-all duration-200 ease-out'
              )}
              style={{
                width: r * 2,
                height: r * 2,
                backgroundColor: active ? color : color + 'CC',
                boxShadow: active ? `0 0 12px ${color}66, 0 2px 6px rgba(0,0,0,0.15)` : '0 1px 3px rgba(0,0,0,0.12)',
              }}
            >
              {active && (
                <Icon
                  className="text-white"
                  style={{ width: r * 0.9, height: r * 0.9 }}
                  strokeWidth={2.2}
                />
              )}
            </span>

            {/* Label — always visible, styled differently when active */}
            <span
              className={cx(
                'pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono-intel transition-all duration-200',
                active
                  ? 'top-[calc(100%+5px)] rounded-md bg-slate-900/90 px-2 py-1 text-[11px] font-semibold text-white shadow-lg'
                  : 'top-[calc(100%+3px)] text-[9.5px] font-medium text-slate-500'
              )}
            >
              {node.label.length > 14 ? node.label.slice(0, 14) + '…' : node.label}
              {active && node.confidence !== undefined && (
                <span className="ml-1.5 text-emerald-400">{node.confidence}%</span>
              )}
            </span>
          </button>
        )
      })}

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-white/85 px-3 py-2 shadow-sm backdrop-blur-sm">
        {(Object.keys(NODE_COLOR) as GraphNode['type'][])
          .filter((t) => visibleNodes.some((n) => n.type === t))
          .map((type) => (
            <span key={type} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NODE_COLOR[type] }} />
              {NODE_LABEL[type]}
            </span>
          ))}
      </div>

      {/* Count badge */}
      <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-white/85 px-2 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
        {visibleNodes.length} nodes · {visibleEdges.length} links
      </div>
    </div>
  )
}

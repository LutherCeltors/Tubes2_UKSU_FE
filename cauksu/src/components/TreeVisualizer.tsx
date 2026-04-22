import { useEffect, useMemo, useState } from 'react'

const H_GAP = 72
const V_GAP = 96
const NODE_R = 18
const STEP_MS = 240
const ZOOM_MS = 800
const PAD = 40

interface JSONNode {
  id: number
  tag: string
  attributes: Record<string, string>
  children?: JSONNode[]
}

export interface LogEntry {
  nodeId: number
  tag: string
  status: 'visited' | 'matched'
}

interface LayoutNode {
  id: number
  tag: string
  x: number
  y: number
  children: LayoutNode[]
}

interface EdgeDef {
  parentId: number
  childId: number
  x1: number; y1: number
  x2: number; y2: number
  len: number
}

function computeLayout(root: JSONNode): LayoutNode {
  let leaf = 0
  function pass1(node: JSONNode): LayoutNode {
    if (!node.children?.length) {
      return { id: node.id, tag: node.tag, x: leaf++ * H_GAP, y: 0, children: [] }
    }
    const kids = node.children.map(pass1)
    return { id: node.id, tag: node.tag, x: (kids[0].x + kids[kids.length - 1].x) / 2, y: 0, children: kids }
  }
  function pass2(node: LayoutNode, d: number): LayoutNode {
    return { ...node, y: d * V_GAP, children: node.children.map(c => pass2(c, d + 1)) }
  }
  return pass2(pass1(root), 0)
}

function flatNodes(n: LayoutNode): LayoutNode[] {
  return [n, ...n.children.flatMap(flatNodes)]
}

function flatEdges(n: LayoutNode): EdgeDef[] {
  return n.children.flatMap(c => {
    const dx = c.x - n.x, dy = c.y - n.y
    return [
      { parentId: n.id, childId: c.id, x1: n.x, y1: n.y, x2: c.x, y2: c.y, len: Math.hypot(dx, dy) },
      ...flatEdges(c),
    ]
  })
}

interface Props {
  tree: JSONNode
  traversalLog: LogEntry[]
  animPhase: 'idle' | 'zoom' | 'traverse' | 'done'
  onZoomDone: () => void
  onTraverseDone: () => void
}

export default function TreeVisualizer({ tree, traversalLog, animPhase, onZoomDone, onTraverseDone }: Props) {
  const layout = useMemo(() => computeLayout(tree), [tree])
  const nodes  = useMemo(() => flatNodes(layout), [layout])
  const edges  = useMemo(() => flatEdges(layout), [layout])

  const minX = Math.min(...nodes.map(n => n.x)) - PAD
  const maxX = Math.max(...nodes.map(n => n.x)) + PAD
  const minY = Math.min(...nodes.map(n => n.y)) - PAD
  const maxY = Math.max(...nodes.map(n => n.y)) + PAD
  const vbW  = maxX - minX
  const vbH  = maxY - minY

  const rootNode = nodes.find(n => n.id === tree.id)
  const rootXPct = rootNode ? ((rootNode.x - minX) / vbW) * 100 : 50
  const rootYPct = rootNode ? ((rootNode.y - minY) / vbH) * 100 : 10

  const [step, setStep]           = useState(0)
  const [zoomingOut, setZoomingOut] = useState(false)

  // Reset on new data
  useEffect(() => {
    setStep(0)
    setZoomingOut(false)
  }, [tree])

  // Zoom-in → zoom-out sequence
  useEffect(() => {
    if (animPhase !== 'zoom') return
    setZoomingOut(false)
    const t1 = setTimeout(() => setZoomingOut(true), 50)
    const t2 = setTimeout(() => onZoomDone(), ZOOM_MS + 60)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [animPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Traversal stepping
  useEffect(() => {
    if (animPhase !== 'traverse') return
    if (step >= traversalLog.length) { onTraverseDone(); return }
    const t = setTimeout(() => setStep(s => s + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [animPhase, step]) // eslint-disable-line react-hooks/exhaustive-deps

  const revealedLog  = traversalLog.slice(0, step)
  const visitedIds   = new Set(revealedLog.map(e => e.nodeId))
  const matchedIds   = new Set(revealedLog.filter(e => e.status === 'matched').map(e => e.nodeId))
  const activeId     = revealedLog[revealedLog.length - 1]?.nodeId ?? -1
  const isZoomedIn   = animPhase === 'zoom' && !zoomingOut

  return (
    <div className="tree-wrap">
      <div className={`vignette${isZoomedIn ? ' vignette--active' : ''}`} />

      <div
        className="tree-zoom-container"
        style={{
          transform: isZoomedIn ? 'scale(2.6)' : 'scale(1)',
          transformOrigin: `${rootXPct}% ${rootYPct}%`,
          transition: zoomingOut
            ? `transform ${ZOOM_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
            : 'none',
        }}
      >
        <svg
          viewBox={`${minX} ${minY} ${vbW} ${vbH}`}
          width="100%" height="100%"
          className="tree-svg"
        >
          <defs>
            <filter id="glow-blue" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-gold" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map(e => {
            const isTraversed = visitedIds.has(e.childId)
            const isActive    = e.childId === activeId && animPhase === 'traverse'
            return (
              <line
                key={`e-${e.parentId}-${e.childId}`}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke={isActive ? '#63b3ed' : isTraversed ? '#4a5568' : '#1e293b'}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeDasharray={e.len}
                strokeDashoffset={isTraversed ? 0 : e.len}
                style={{
                  transition: 'stroke-dashoffset 0.28s ease, stroke 0.2s, stroke-width 0.2s',
                  filter: isActive ? 'drop-shadow(0 0 7px #63b3ed)' : 'none',
                }}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const isVisited = visitedIds.has(n.id)
            const isMatched = matchedIds.has(n.id)
            const isActive  = n.id === activeId
            const isRoot    = n.id === tree.id

            const fill   = isMatched ? '#7c3b0a' : isVisited ? '#1a365d' : isRoot ? '#1a202c' : '#0f172a'
            const stroke = isMatched ? '#f6ad55' : isVisited ? '#63b3ed' : isRoot ? '#475569' : '#1e293b'
            const glow   = isMatched
              ? 'drop-shadow(0 0 9px #f6ad55)'
              : isActive
                ? 'drop-shadow(0 0 7px #63b3ed)'
                : 'none'

            return (
              <g key={`n-${n.id}`} transform={`translate(${n.x},${n.y})`}>
                {isActive && (
                  <circle
                    r={NODE_R + 10}
                    fill="none"
                    stroke={isMatched ? '#f6ad55' : '#63b3ed'}
                    strokeWidth="1.5"
                    opacity="0"
                    className="pulse-ring"
                  />
                )}
                <circle
                  r={NODE_R}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isActive || isMatched ? 2.5 : 1.5}
                  opacity={isVisited || isRoot ? 1 : 0.25}
                  style={{ transition: 'fill 0.22s, stroke 0.22s, opacity 0.22s', filter: glow }}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={8}
                  fill={isVisited ? '#e2e8f0' : '#475569'}
                  style={{ transition: 'fill 0.22s', userSelect: 'none', pointerEvents: 'none' }}
                >
                  {n.tag.length > 6 ? n.tag.slice(0, 5) + '…' : n.tag}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

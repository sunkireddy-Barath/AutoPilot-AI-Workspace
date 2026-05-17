import React, { useMemo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';

// What each connection carries
const EDGE_MESSAGES: Record<string, { label: string; color: string }> = {
  'goal→orchestrator':      { label: 'Strategic Objective',    color: '#6366f1' },
  'orchestrator→agent_pm':  { label: 'Product Requirements',   color: '#8B5CF6' },
  'orchestrator→agent_dev': { label: 'Architecture Spec',      color: '#06B6D4' },
  'orchestrator→agent_mkt': { label: 'GTM Directive',          color: '#F59E0B' },
  'orchestrator→agent_ops': { label: 'Ops Configuration',      color: '#EC4899' },
  'orchestrator→agent_ana': { label: 'Analysis Brief',         color: '#10B981' },
  'agent_pm→orchestrator':  { label: 'User Stories ✓',         color: '#8B5CF6' },
  'agent_dev→orchestrator': { label: 'API Design ✓',           color: '#06B6D4' },
  'agent_mkt→orchestrator': { label: 'Campaign Plan ✓',        color: '#F59E0B' },
  'agent_ops→orchestrator': { label: 'Runbook ✓',              color: '#EC4899' },
  'agent_ana→orchestrator': { label: 'KPI Report ✓',           color: '#10B981' },
}

function edgeKey(source: string, target: string) {
  return `${source}→${target}`
}

// Each particle: size, color, speed-offset, glow
const PARTICLES = [
  { r: 3.5, fill: '#ffffff', glow: 'rgba(255,255,255,0.9)', speedMult: 1.0,  delay: 0 },
  { r: 5,   fill: '#6366f1', glow: 'rgba(99,102,241,0.9)',  speedMult: 0.75, delay: 0.4 },
  { r: 2.5, fill: '#06B6D4', glow: 'rgba(6,182,212,0.8)',   speedMult: 1.3,  delay: 0.9 },
  { r: 4,   fill: '#8B5CF6', glow: 'rgba(139,92,246,0.9)',  speedMult: 0.9,  delay: 1.5 },
  { r: 2,   fill: '#10B981', glow: 'rgba(16,185,129,0.8)',  speedMult: 1.6,  delay: 0.2 },
]

export default function CustomEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const { isAgentsRunning, agentCollaborations } = useStore()
  const isSimulating = isAgentsRunning || data?.isSimulating

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const meta = EDGE_MESSAGES[edgeKey(source, target)]
  const edgeColor = meta?.color ?? 'rgba(255,255,255,0.55)'

  // Random base durations, stable across renders
  const baseDurs = useMemo(
    () => PARTICLES.map(() => 1.4 + Math.random() * 1.2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  )

  const hasCollab = agentCollaborations.some(c => {
    const src = source.replace('agent_', '').replace('pm', 'product_manager').replace('mkt', 'marketing').replace('ana', 'analyst')
    const tgt = target.replace('agent_', '').replace('mkt', 'marketing').replace('ana', 'analyst')
    return c.source === src && c.target === tgt
  })

  return (
    <>
      {/* Glow layer when active */}
      {isSimulating && (
        <path
          d={edgePath}
          fill="none"
          stroke={edgeColor}
          strokeWidth={6}
          strokeOpacity={0.15}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${edgeColor})` }}
        />
      )}

      {/* Main edge line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isSimulating ? edgeColor : 'rgba(255,255,255,0.22)',
          strokeWidth: isSimulating ? 2.5 : 1.5,
          strokeLinecap: 'round',
          fill: 'none',
          transition: 'stroke 0.3s, stroke-width 0.3s',
        }}
      />

      {/* Particle swarm */}
      {isSimulating && PARTICLES.map((p, i) => (
        <circle
          key={i}
          r={p.r}
          fill={p.fill}
          style={{ filter: `drop-shadow(0 0 ${p.r * 2}px ${p.glow})` }}
        >
          <animateMotion
            dur={`${baseDurs[i] * p.speedMult}s`}
            begin={`${p.delay}s`}
            repeatCount="indefinite"
            path={edgePath}
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="linear"
          />
        </circle>
      ))}

      <EdgeLabelRenderer>
        {/* Persistent edge label */}
        {meta && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={isSimulating
                ? { opacity: [0.8, 1, 0.8], scale: [1, 1.06, 1] }
                : { opacity: 0.35, scale: 1 }
              }
              transition={{ duration: 1.8, repeat: Infinity }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full border whitespace-nowrap"
              style={{
                background: isSimulating
                  ? `rgba(${hexToRgb(edgeColor)},0.18)`
                  : 'rgba(10,10,15,0.7)',
                borderColor: isSimulating ? edgeColor : 'rgba(255,255,255,0.08)',
                boxShadow: isSimulating ? `0 0 12px ${edgeColor}40` : 'none',
              }}
            >
              {isSimulating && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: edgeColor }}
                />
              )}
              <span
                className="text-[8px] font-black uppercase tracking-wider"
                style={{ color: isSimulating ? edgeColor : 'rgba(255,255,255,0.4)' }}
              >
                {meta.label}
              </span>
            </motion.div>
          </div>
        )}

        {/* Collab handoff badge */}
        {hasCollab && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -150%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="px-2 py-0.5 rounded-md bg-brand-600 text-white text-[8px] font-black uppercase tracking-widest border border-white/20 shadow-glow-brand whitespace-nowrap"
          >
            Handoff Active
          </motion.div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

import React, { useMemo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

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
  data
}: EdgeProps) {
  const { agentCollaborations } = useStore();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Find if there's a recent collaboration for this specific edge
  // Map internal IDs to roles
  const sourceRole = source.replace('agent_', '').replace('pm', 'product_manager').replace('mkt', 'marketing');
  const targetRole = target.replace('agent_', '').replace('mkt', 'marketing').replace('ana', 'analyst');

  const latestCollab = agentCollaborations.find(c => 
    (c.source === sourceRole && c.target === targetRole)
  );

  const dur1 = useMemo(() => 1.5 + Math.random(), []);
  const dur2 = useMemo(() => 1.5 + Math.random(), []);
  const begin1 = useMemo(() => Math.random() * 2, []);
  const begin2 = useMemo(() => Math.random() * 2, []);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: 'rgba(255, 255, 255, 0.55)',
          strokeWidth: 2,
          strokeLinecap: 'round',
          fill: 'none',
        }}
      />

      <EdgeLabelRenderer>
        <AnimatePresence>
          {latestCollab && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
              }}
              className="bg-brand-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg shadow-glow-brand whitespace-nowrap z-50 border border-white/20"
            >
              Handoff Active
            </motion.div>
          )}
        </AnimatePresence>
      </EdgeLabelRenderer>

      {data?.isSimulating && (
        <>
          <circle r="3" fill="#ffffff" filter="drop-shadow(0 0 6px rgba(255,255,255,0.9))">
            <animateMotion 
              dur={`${dur1}s`} 
              begin={`${begin1}s`}
              repeatCount="indefinite" 
              path={edgePath} 
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
          <circle r="4" fill="#6366f1" filter="drop-shadow(0 0 8px rgba(99,102,241,0.9))">
            <animateMotion 
              dur={`${dur2}s`} 
              begin={`${begin2}s`}
              repeatCount="indefinite" 
              path={edgePath} 
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        </>
      )}
    </>
  );
}

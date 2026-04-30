import React, { useMemo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const dur1 = useMemo(() => 1.5 + Math.random(), []);
  const dur2 = useMemo(() => 1.5 + Math.random(), []);
  const begin1 = useMemo(() => Math.random() * 2, []);
  const begin2 = useMemo(() => Math.random() * 2, []);

  return (
    <>
      {/* Force white visible line using BaseEdge */}
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
          <circle r="3" fill="#ffffff" filter="drop-shadow(0 0 8px rgba(255,255,255,0.9))">
            <animateMotion 
              dur={`${dur2}s`} 
              begin={`${begin2}s`}
              repeatCount="indefinite" 
              path={edgePath} 
              keyPoints="1;0"
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        </>
      )}
    </>
  );
}

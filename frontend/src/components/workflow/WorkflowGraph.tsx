'use client'

import { useCallback, useEffect } from 'react'
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  Panel,
  MiniMap
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '@/lib/store'
import AgentNode from './AgentNode'
import TaskNode from './TaskNode'

const nodeTypes = {
  agent: AgentNode,
  task: TaskNode,
}

export default function WorkflowGraph() {
  const { workflowNodes, workflowEdges } = useStore()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Sync with store
  useEffect(() => {
    setNodes(workflowNodes as any)
    setEdges(workflowEdges as any)
  }, [workflowNodes, workflowEdges, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="w-full h-full bg-surface-900 overflow-hidden relative border border-white/5 rounded-2xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="rgba(255,255,255,0.05)" 
        />
        
        <Panel position="top-right" className="glass p-2 flex flex-col gap-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">Graph Legend</div>
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-[10px] text-slate-300 font-medium">Data Pipe</span>
          </div>
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-agent-dev" />
            <span className="text-[10px] text-slate-300 font-medium">Agent Node</span>
          </div>
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-[10px] text-slate-300 font-medium">Task Node</span>
          </div>
        </Panel>

        <MiniMap 
          nodeStrokeWidth={3}
          maskColor="rgba(0,0,0,0.4)"
          style={{ 
            backgroundColor: 'rgba(10,10,15,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px'
          }}
          nodeColor={(n) => {
            if (n.type === 'agent') return 'rgba(99, 102, 241, 0.5)'
            return 'rgba(255, 255, 255, 0.1)'
          }}
        />
        
        <Controls 
          className="glass p-1 border-white/5 fill-white" 
          showInteractive={false} 
        />
      </ReactFlow>

      {/* Floating Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-mesh-gradient opacity-30" />
    </div>
  )
}

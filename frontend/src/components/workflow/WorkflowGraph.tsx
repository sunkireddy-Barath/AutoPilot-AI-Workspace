'use client'

import { useCallback, useEffect, useMemo } from 'react'
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
import dagre from 'dagre'
import '@xyflow/react/dist/style.css'
import { useStore, AgentRole } from '@/lib/store'
import AgentNode from './AgentNode'
import TaskNode from './TaskNode'
import GoalNode from './GoalNode'

const nodeTypes = {
  agent: AgentNode,
  task: TaskNode,
  goal: GoalNode,
}

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 200
const nodeHeight = 100

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export default function WorkflowGraph() {
  const { 
    workflowNodes, 
    workflowEdges, 
    agentStatuses,
    isAgentsRunning 
  } = useStore()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Sync with store and apply layout
  useEffect(() => {
    if (workflowNodes.length === 0) return

    // Enrich agent nodes with current status from store
    const enrichedNodes = workflowNodes.map(node => {
      if (node.type === 'agent') {
        const role = node.data.role as AgentRole
        return {
          ...node,
          data: { ...node.data, status: agentStatuses[role] || 'idle' }
        }
      }
      return node
    })

    // Animate edges if agents are running
    const enrichedEdges = workflowEdges.map(edge => ({
      ...edge,
      animated: isAgentsRunning,
      style: { stroke: isAgentsRunning ? '#6366f1' : 'rgba(255,255,255,0.1)', strokeWidth: 2 },
    }))

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      enrichedNodes,
      enrichedEdges
    )
    
    setNodes(layoutedNodes as any)
    setEdges(layoutedEdges as any)
  }, [workflowNodes, workflowEdges, agentStatuses, isAgentsRunning, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative border border-white/5 rounded-[32px] glass-strong">
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
        className="cursor-grab active:cursor-grabbing"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="rgba(255,255,255,0.05)" 
        />
        
        <Panel position="top-right" className="glass p-2 flex flex-col gap-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">Graph Legend</div>
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-[10px] text-slate-300 font-medium">Data Pipeline</span>
          </div>
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-agent-dev" />
            <span className="text-[10px] text-slate-300 font-medium">Agent Node</span>
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

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
import CustomEdge from './CustomEdge'

const nodeTypes = {
  agent: AgentNode,
  task: TaskNode,
  goal: GoalNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 200
const nodeHeight = 100

const getLayoutedElements = (nodes: any[], edges: any[]) => {
  // Find the center node (orchestrator or the first node if none)
  const centerNodeIndex = nodes.findIndex(n => n.data?.role === 'orchestrator' || n.id.includes('orchestrator'));
  const centerNode = centerNodeIndex !== -1 ? nodes[centerNodeIndex] : (nodes.length > 0 ? nodes[0] : null);
  
  if (!centerNode) return { nodes, edges };

  const radiusX = 550;
  const radiusY = 250;
  const otherNodes = nodes.filter(n => n.id !== centerNode.id);
  const angleStep = (2 * Math.PI) / (otherNodes.length || 1);

  const layoutedNodes = nodes.map((node) => {
    if (node.id === centerNode.id) {
      return {
        ...node,
        targetPosition: 'top',
        sourcePosition: 'bottom',
        position: { x: 0, y: 0 },
      };
    }

    const index = otherNodes.findIndex(n => n.id === node.id);
    const angle = index * angleStep - Math.PI / 2; // Start from top
    
    return {
      ...node,
      targetPosition: 'top',
      sourcePosition: 'bottom',
      position: {
        x: radiusX * Math.cos(angle),
        y: radiusY * Math.sin(angle),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
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
      type: 'custom',
      animated: false,
      data: { ...edge.data, isSimulating: isAgentsRunning },
      style: {},
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
        edgeTypes={edgeTypes}
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

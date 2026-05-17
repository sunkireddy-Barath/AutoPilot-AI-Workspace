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
  BackgroundVariant,
  Panel,
  MiniMap,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore, AgentRole, Task } from '@/lib/store'
import AgentNode from './AgentNode'
import TaskNode from './TaskNode'
import GoalNode from './GoalNode'
import CustomEdge from './CustomEdge'
import { motion } from 'framer-motion'
import { Network, Loader2 } from 'lucide-react'

const nodeTypes = { agent: AgentNode, task: TaskNode, goal: GoalNode }
const edgeTypes = { custom: CustomEdge }

// Hierarchical top-down layout: Goal → Orchestrator → Agents row → Tasks below each agent
function buildLayout(nodes: any[], edges: any[]): { nodes: any[]; edges: any[] } {
  if (nodes.length === 0) return { nodes, edges }

  const goalNodes = nodes.filter((n) => n.type === 'goal')
  const orchestratorNode = nodes.find((n) => n.data?.role === 'orchestrator' || n.id === 'orchestrator')
  const agentNodes = nodes.filter((n) => n.type === 'agent' && n.id !== orchestratorNode?.id)
  const taskNodes = nodes.filter((n) => n.type === 'task')

  const COL_W = 220
  const agentCount = agentNodes.length || 1
  const startX = -((agentCount - 1) * COL_W) / 2

  const layouted: any[] = []

  // Goal — top center
  goalNodes.forEach((gn) => {
    layouted.push({ ...gn, position: { x: 0, y: -320 } })
  })

  // Orchestrator — center
  if (orchestratorNode) {
    layouted.push({ ...orchestratorNode, position: { x: 0, y: -160 } })
  }

  // Agents — horizontal row
  const agentPositions: Record<string, { x: number; y: number }> = {}
  agentNodes.forEach((node, i) => {
    const pos = { x: startX + i * COL_W, y: 0 }
    agentPositions[node.data?.role as string] = pos
    layouted.push({ ...node, position: pos })
  })

  // Tasks — below their assigned agent, 2-column grid per agent
  const agentTaskMap: Record<string, any[]> = {}
  const unassigned: any[] = []
  taskNodes.forEach((tn) => {
    const role = tn.data?.assigned_agent as string | undefined
    if (role && agentPositions[role]) {
      agentTaskMap[role] = agentTaskMap[role] || []
      agentTaskMap[role].push(tn)
    } else {
      unassigned.push(tn)
    }
  })

  Object.entries(agentTaskMap).forEach(([role, tasks]) => {
    const { x, y } = agentPositions[role]
    tasks.forEach((tn, ti) => {
      layouted.push({
        ...tn,
        position: {
          x: x - 95 + (ti % 2) * 200,
          y: y + 180 + Math.floor(ti / 2) * 160,
        },
      })
    })
  })

  unassigned.forEach((tn, i) => {
    layouted.push({
      ...tn,
      position: { x: (i - unassigned.length / 2) * 220, y: 200 },
    })
  })

  return { nodes: layouted, edges }
}

// Build dynamic graph data by merging workflow nodes with live tasks from store
function buildGraphData(
  workflowNodes: any[],
  workflowEdges: any[],
  tasks: Task[],
  agentStatuses: Record<AgentRole, string>,
  isSimulating: boolean
) {
  // Enrich agent nodes with live status
  const enrichedAgentNodes = workflowNodes.map((node) => {
    if (node.type === 'agent') {
      const role = node.data.role as AgentRole
      return { ...node, data: { ...node.data, status: agentStatuses[role] || 'idle' } }
    }
    return node
  })

  // Convert store tasks → task nodes (only add if not already in workflowNodes)
  const existingTaskIds = new Set(workflowNodes.filter((n) => n.type === 'task').map((n) => n.id))
  const dynamicTaskNodes = tasks
    .filter((t) => !existingTaskIds.has(t.id) && !existingTaskIds.has(`task_${t.id}`))
    .map((t) => ({
      id: `task_${t.id}`,
      type: 'task',
      data: {
        title: t.title,
        status: t.status,
        priority: t.priority,
        progress: t.progress,
        assigned_agent: t.assigned_agent,
      },
      position: { x: 0, y: 0 },
    }))

  // Build edges for dynamic task nodes → their assigned agent
  const agentNodeIdMap: Record<string, string> = {
    product_manager: 'agent_pm',
    developer: 'agent_dev',
    marketing: 'agent_mkt',
    analyst: 'agent_ana',
    orchestrator: 'agent_orchestrator',
    operations: 'agent_ops',
  }

  const dynamicTaskEdges = dynamicTaskNodes
    .filter((tn) => tn.data.assigned_agent)
    .map((tn) => {
      const agentId = agentNodeIdMap[tn.data.assigned_agent as string] || `agent_${tn.data.assigned_agent}`
      return {
        id: `e_${agentId}_${tn.id}`,
        source: agentId,
        target: tn.id,
        type: 'custom',
        animated: false,
        data: { isSimulating },
      }
    })

  const allNodes = [...enrichedAgentNodes, ...dynamicTaskNodes]
  const enrichedEdges = [
    ...workflowEdges.map((e) => ({
      ...e,
      type: 'custom',
      animated: false,
      data: { ...e.data, isSimulating },
    })),
    ...dynamicTaskEdges,
  ]

  return { nodes: allNodes, edges: enrichedEdges }
}

export default function WorkflowGraph() {
  const { workflowNodes, workflowEdges, agentStatuses, isAgentsRunning, tasks } = useStore()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const { nodes: rawNodes, edges: rawEdges } = buildGraphData(
      workflowNodes,
      workflowEdges,
      tasks,
      agentStatuses as Record<AgentRole, string>,
      isAgentsRunning
    )
    const { nodes: layoutedNodes, edges: layoutedEdges } = buildLayout(rawNodes, rawEdges)
    setNodes(layoutedNodes as any)
    setEdges(layoutedEdges as any)
  }, [workflowNodes, workflowEdges, agentStatuses, isAgentsRunning, tasks, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const hasData = workflowNodes.length > 0

  if (!hasData) {
    return (
      <div className="w-full h-full rounded-[32px] glass-strong border border-white/5 flex flex-col items-center justify-center gap-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-20 h-20 rounded-3xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center"
        >
          <Network className="h-9 w-9 text-brand-400" />
        </motion.div>
        <div className="text-center">
          <p className="text-white font-bold text-base mb-1">No workflow yet</p>
          <p className="text-slate-500 text-sm">Send a message in the chat to generate the agent graph</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20">
          <Loader2 className="h-3.5 w-3.5 text-brand-400 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">Awaiting directive</span>
        </div>
      </div>
    )
  }

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
        fitViewOptions={{ padding: 0.25 }}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        className="cursor-grab active:cursor-grabbing"
        defaultEdgeOptions={{ type: 'custom' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.04)"
        />

        {/* Legend */}
        <Panel position="top-left" className="glass p-3 rounded-2xl border-white/5 flex flex-col gap-2 m-2">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Legend</div>
          {[
            { color: 'bg-indigo-500', label: 'Orchestrator' },
            { color: 'bg-violet-500', label: 'Agent Nodes' },
            { color: 'bg-brand-500', label: 'Task Nodes' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[10px] text-slate-400 font-medium">{item.label}</span>
            </div>
          ))}
        </Panel>

        {/* Live status */}
        {isAgentsRunning && (
          <Panel position="top-right" className="m-2">
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-2 px-3 py-2 rounded-full glass border border-brand-500/30 shadow-glow-brand/20"
            >
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-400">Swarm Active</span>
            </motion.div>
          </Panel>
        )}

        <MiniMap
          nodeStrokeWidth={2}
          maskColor="rgba(0,0,0,0.5)"
          style={{
            backgroundColor: 'rgba(8,8,14,0.9)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
          }}
          nodeColor={(n) => {
            if (n.type === 'goal') return 'rgba(99,102,241,0.8)'
            if (n.type === 'agent') return 'rgba(139,92,246,0.5)'
            return 'rgba(255,255,255,0.1)'
          }}
        />

        <Controls
          className="glass p-1 border-white/5 rounded-xl"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.06),transparent_60%)] rounded-[32px]" />
    </div>
  )
}

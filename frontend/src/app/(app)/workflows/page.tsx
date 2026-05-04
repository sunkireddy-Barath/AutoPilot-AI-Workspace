'use client'

import { useEffect } from 'react'
import WorkflowGraph from '@/components/workflow/WorkflowGraph'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { useStore } from '@/lib/store'
import { workflowsApi } from '@/lib/api'
import { motion } from 'framer-motion'
import { Network, Share2, Download, Maximize2, Zap } from 'lucide-react'
import AgentCollaborationLog from '@/components/workflow/AgentCollaborationLog'

export default function WorkflowsPage() {
  const { userId, setWorkflowGraph, workflowNodes, agentActivities, tasks, isAgentsRunning, setAgentsRunning } = useStore()

  // Dynamic Calculations
  const activeNodes = workflowNodes.filter(n => n.data?.role !== 'orchestrator').length
  
  const orchestratorLog = agentActivities.find(a => a.agent_role === 'orchestrator')
  const insightText = orchestratorLog ? orchestratorLog.detail : "Graph initialized. Awaiting orchestrator routing."
  
  const totalTasks = tasks.length || 1
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const optScore = tasks.length === 0 ? 100 : Math.round((completedTasks / totalTasks) * 100)

  useEffect(() => {
    if (!userId) return

    const fetchWorkflow = async () => {
      try {
        const workflows = await workflowsApi.list(userId) as any[]
        if (workflows.length > 0) {
          const latest = workflows[0]
          setWorkflowGraph(latest.nodes, latest.edges)
        }
      } catch (error) {
        console.error('Failed to fetch workflows:', error)
      }
    }

    fetchWorkflow()
  }, [userId, setWorkflowGraph])

  return (
    <div className="p-8 h-screen flex flex-col">
      <DashboardHeader 
        title="Visual Workflow" 
        subtitle="Real-time map of agent collaboration and task dependency graph." 
      />

      <div className="flex-1 min-h-0 flex gap-6">
        <div className="flex-1 flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between glass p-2 px-4 border-white/5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-500 shadow-glow-brand" />
                <span className="text-xs font-bold text-white uppercase tracking-tighter">Live Connection</span>
              </div>
              <button 
                onClick={() => setAgentsRunning(!isAgentsRunning)}
                className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 border border-brand-500/30"
              >
                {isAgentsRunning ? 'Stop Simulation' : 'Simulate Swarm'}
              </button>
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-slate-400 font-medium">{activeNodes} Active Nodes</span>
              </div>
            </div>

            <div className="group flex items-center gap-2">
              <button className="btn-ghost p-2" title="Maximize"><Maximize2 className="h-4 w-4" /></button>
              <button className="btn-ghost p-2" title="Share Grant"><Share2 className="h-4 w-4" /></button>
              <button className="btn-ghost p-2" title="Export PNG"><Download className="h-4 w-4" /></button>
            </div>
          </div>

          {/* The Graph */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 min-h-0 rounded-[32px] overflow-hidden relative shadow-2xl"
          >
            <WorkflowGraph />
          </motion.div>
        </div>

        {/* Right Side Panel - Collaboration Log */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 h-full hidden xl:flex flex-col"
        >
          <AgentCollaborationLog />
        </motion.div>
      </div>

      {/* Floating Insight Card */}
      <motion.div 
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 right-8 w-80 glass-strong p-6 shadow-2xl z-20 border-brand-500/30"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="bg-brand-500/10 p-2 rounded-lg">
            <Network className="h-5 w-5 text-brand-400" />
          </div>
          <div className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Graph Insight</div>
        </div>
        <h4 className="text-sm font-bold text-white mb-2">Autonomous Path Optimized</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          {insightText}
        </p>
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500 uppercase font-bold">Optimization Score</span>
            <span className="text-green-400 font-bold">{optScore}%</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

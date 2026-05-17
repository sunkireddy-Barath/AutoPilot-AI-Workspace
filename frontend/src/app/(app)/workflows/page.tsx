'use client'

import { useEffect } from 'react'
import WorkflowGraph from '@/components/workflow/WorkflowGraph'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { useStore } from '@/lib/store'
import { workflowsApi } from '@/lib/api'
import { motion } from 'framer-motion'
import { Network, Share2, Download, Maximize2, Zap, Activity, CheckSquare } from 'lucide-react'
import AgentCollaborationLog from '@/components/workflow/AgentCollaborationLog'
import toast from 'react-hot-toast'

export default function WorkflowsPage() {
  const { userId, setWorkflowGraph, workflowNodes, agentActivities, tasks, isAgentsRunning, setAgentsRunning } = useStore()

  const activeNodes = workflowNodes.filter(n => n.data?.role !== 'orchestrator').length
  const orchestratorLog = agentActivities.find(a => a.agent_role === 'orchestrator')
  const insightText = orchestratorLog?.detail ?? 'Graph initialized. Awaiting orchestrator routing.'
  const totalTasks = tasks.length || 1
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const optScore = tasks.length === 0 ? 100 : Math.round((completedTasks / totalTasks) * 100)

  useEffect(() => {
    if (!userId) return
    workflowsApi.list(userId).then((workflows: any[]) => {
      if (workflows.length > 0) {
        const latest = workflows[0]
        setWorkflowGraph(latest.nodes, latest.edges)
      }
    }).catch(console.error)
  }, [userId, setWorkflowGraph])

  return (
    <div className="p-6 h-screen flex flex-col gap-4 pb-28">
      <DashboardHeader
        title="Visual Workflow"
        subtitle="Real-time map of agent collaboration and task dependency graph."
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between glass px-4 py-2.5 rounded-2xl border-white/5 shrink-0">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
            />
            <span className="text-xs font-bold text-white uppercase tracking-tighter">Live Connection</span>
          </div>

          <button
            onClick={() => setAgentsRunning(!isAgentsRunning)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all border ${
              isAgentsRunning
                ? 'bg-brand-500/20 text-brand-400 border-brand-500/30 hover:bg-brand-500/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
          >
            {isAgentsRunning ? 'Stop Simulation' : 'Simulate Swarm'}
          </button>

          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-400 font-medium">{activeNodes} Agent Nodes</span>
          </div>

          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-400 font-medium">{tasks.length} Tasks</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const el = document.querySelector('.react-flow') as HTMLElement
              if (el?.requestFullscreen) el.requestFullscreen()
            }}
            className="btn-ghost p-2 rounded-xl hover:bg-white/5 transition-colors" title="Maximize graph"
          >
            <Maximize2 className="h-4 w-4 text-slate-400" />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              toast.success('Workflow link copied!')
            }}
            className="btn-ghost p-2 rounded-xl hover:bg-white/5 transition-colors" title="Copy link"
          >
            <Share2 className="h-4 w-4 text-slate-400" />
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify({ nodes: workflowNodes, tasks }, null, 2)
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'autopilot-workflow.json'
              a.click()
              URL.revokeObjectURL(url)
              toast.success('Workflow exported as JSON')
            }}
            className="btn-ghost p-2 rounded-xl hover:bg-white/5 transition-colors" title="Export JSON"
          >
            <Download className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Graph */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 min-h-0 min-w-0"
        >
          <WorkflowGraph />
        </motion.div>

        {/* Right Panel */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-72 shrink-0 flex flex-col gap-3 min-h-0"
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="glass rounded-2xl p-4 border-white/5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-brand-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active</span>
              </div>
              <div className="text-2xl font-black text-white">{inProgressTasks}</div>
              <div className="text-[9px] text-slate-500 font-medium">tasks running</div>
            </div>

            <div className="glass rounded-2xl p-4 border-white/5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Score</span>
              </div>
              <div className="text-2xl font-black text-emerald-400">{optScore}%</div>
              <div className="text-[9px] text-slate-500 font-medium">completion rate</div>
            </div>
          </div>

          {/* Graph Insight Card */}
          <div className="glass rounded-2xl p-4 border-white/5 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-brand-500/10">
                <Network className="h-3.5 w-3.5 text-brand-400" />
              </div>
              <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest">Graph Insight</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {insightText}
            </p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Optimization</span>
                <span className="text-[11px] font-black text-emerald-400">{optScore}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${optScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Collaboration Log — fills remaining space */}
          <div className="flex-1 min-h-0 glass rounded-2xl p-4 border-white/5 overflow-hidden">
            <AgentCollaborationLog />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

'use client'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import AgentGrid from '@/components/agents/AgentGrid'
import { motion } from 'framer-motion'
import { Shield, Zap, Info, Play, Pause } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AgentsPage() {
  const { isAgentsRunning, setAgentsRunning } = useStore()

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <DashboardHeader 
        title="AI Agents" 
        subtitle="Manage and monitor the specialized AI clusters driving your workspace." 
      />

      {/* Global Status Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong p-6 border-brand-500/30 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 shadow-glow-brand flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-white leading-tight">
              Neural Core V4 — {isAgentsRunning ? 'Operational' : 'Paused'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isAgentsRunning 
                ? 'All agent clusters are online and synchronized with the LangGraph orchestrator.'
                : 'All agent processes are currently paused. Click resume to restore operations.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setAgentsRunning(false)
              toast.error('AI execution paused globally')
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              !isAgentsRunning ? "bg-surface-800 text-slate-600 cursor-not-allowed" : "bg-surface-700 border border-white/5 text-slate-300 hover:text-white hover:bg-surface-600"
            )}
            disabled={!isAgentsRunning}
          >
            <Pause className="h-3 w-3" /> PAUSE ALL
          </button>
          <button 
            onClick={() => {
              setAgentsRunning(true)
              toast.success('AI execution resumed')
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-glow-brand transition-all",
              isAgentsRunning ? "bg-brand-800 text-white/50 cursor-not-allowed" : "bg-brand-600 text-white hover:bg-brand-500"
            )}
            disabled={isAgentsRunning}
          >
            <Play className="h-3 w-3" /> RESUME ALL
          </button>
        </div>
      </motion.div>

      {/* Agent Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-400" />
            Specialized Clusters
          </h2>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-800 border border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <Info className="h-3 w-3" /> 4/4 Agents Available
          </div>
        </div>
        <AgentGrid />
      </section>

      {/* Performance Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div className="glass p-8">
          <h3 className="font-bold text-white mb-6">Execution Latency</h3>
          <div className="space-y-6">
            {[
              { label: 'Agent Reasoning', value: '450ms', p: 40 },
              { label: 'Context Retrieval', value: '1.2s', p: 85 },
              { label: 'Global State Sync', value: '120ms', p: 20 },
              { label: 'Blockchain Verification', value: '3.4s', p: 95 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  <span className="text-white font-bold">{item.value}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.p}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-brand-500" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-8 relative overflow-hidden group">
          <h3 className="font-bold text-white mb-6">Instance Health</h3>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-surface-800" />
                <motion.circle 
                  cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray={364.4}
                  initial={{ strokeDashoffset: 364.4 }}
                  animate={{ strokeDashoffset: 364.4 * 0.02 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-brand-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-white">98%</span>
                <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">Healthy</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-slate-500 mt-4 leading-relaxed max-w-xs mx-auto">
            All agent instances are running on premium P3 clusters with multi-region redundancy.
          </p>
        </div>
      </section>
    </div>
  )
}

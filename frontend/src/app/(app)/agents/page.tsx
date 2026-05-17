'use client'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import AgentGrid from '@/components/agents/AgentGrid'
import { motion } from 'framer-motion'
import { Shield, Zap, Info, Play, Pause } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AgentsPage() {
  const { isAgentsRunning, setAgentsRunning, tasks, agentActivities, agentStatuses } = useStore()

  // --- Dynamic Data Calculations ---
  
  // 1. Intelligence Health (Task completion rate)
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length || 1
  const healthScore = Math.round((completedCount / totalTasks) * 100)
  // Ensure it looks healthy even at the start
  const displayHealth = tasks.length === 0 ? 100 : healthScore

  // 2. Active Shards (Count of non-idle agents)
  const activeShards = Object.values(agentStatuses).filter(status => status !== 'idle').length
  const displayShards = activeShards < 10 ? `0${activeShards}` : activeShards.toString()

  // 3. Neural Logs (Latest activities)
  const recentLogs = agentActivities.slice(0, 4)

  return (
    <div className="h-full overflow-y-auto w-full max-w-full px-4 lg:px-16 space-y-8 pb-32 pt-6 custom-scrollbar">
      <div className="pt-8">
        <DashboardHeader
          title="Neural Units"
          subtitle="Specialized AI agents operating within your synchronized cluster."
        >
          
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
            <button 
              onClick={() => {
                setAgentsRunning(false)
                toast.error('All systems paused', { icon: '⏸️' })
              }}
              disabled={!isAgentsRunning}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                isAgentsRunning ? "text-slate-400 hover:text-white hover:bg-white/5" : "bg-red-500/10 text-red-500 border border-red-500/20"
              )}
            >
              <Pause className="h-3.5 w-3.5" /> Pause Matrix
            </button>
            <button 
              onClick={() => {
                setAgentsRunning(true)
                toast.success('Systems operational', { icon: '🚀' })
              }}
              disabled={isAgentsRunning}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                !isAgentsRunning ? "bg-brand-600 text-white shadow-glow-brand" : "text-slate-500 cursor-not-allowed"
              )}
            >
              <Play className="h-3.5 w-3.5" /> Synchronize
            </button>
          </div>
        </DashboardHeader>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Neural Core Module */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-3 glass-strong p-8 rounded-[32px] relative overflow-hidden group border border-white/10 min-h-[400px] flex flex-col justify-between shadow-2xl"
        >
          {/* Animated Background Grid */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/10 via-transparent to-purple-600/10" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className={cn(
                "p-3 rounded-2xl transition-all duration-700",
                isAgentsRunning ? "bg-brand-500/20 text-brand-400 shadow-glow-brand/20" : "bg-red-500/20 text-red-400"
              )}>
                <Zap className={cn("h-6 w-6", isAgentsRunning && "animate-pulse")} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Compute Cluster</div>
                <h2 className="text-3xl font-black text-white tracking-tighter">MeDO Core <span className="text-brand-500">V6.0</span></h2>
              </div>
            </div>

            <p className="text-slate-400 text-sm max-w-xl font-medium leading-relaxed">
              {isAgentsRunning 
                ? "Autonomous agents are currently executing in high-fidelity mode. Neural weights are being synchronized across 5 active shards with sub-10ms latency."
                : "System operations are suspended. Neural shards are currently in hibernation. Initiate synchronization to resume project execution."
              }
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-12 mt-12">
            {[
              { label: 'Cluster Uptime', value: '99.98%', sub: 'Real-time' },
              { label: 'Active Shards', value: displayShards, sub: 'Synchronized' },
              { label: 'Neural Latency', value: '12ms', sub: 'Optimal', color: 'text-brand-400' },
              { label: 'Secure Buffer', value: 'Encrypted', sub: 'AES-256' },
            ].map((stat, idx) => (
              <div key={idx} className="group/stat cursor-default">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover/stat:text-brand-400 transition-colors">{stat.label}</div>
                <div className={cn("text-2xl font-black text-white tracking-tight flex items-baseline gap-2", stat.color)}>
                  {stat.value}
                  <span className="text-[9px] font-bold text-slate-600 tracking-normal">{stat.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Large Floating Glow */}
          <div className={cn(
            "absolute -right-20 -top-20 w-[600px] h-[600px] blur-[160px] transition-all duration-1000 opacity-20 pointer-events-none",
            isAgentsRunning ? "bg-brand-500" : "bg-red-500"
          )} />
        </motion.div>

        {/* System Health Module */}
        <div className="lg:col-span-1 space-y-6">
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="glass-strong p-8 rounded-[32px] border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden"
           >
             <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Intelligence Health</div>
             
             <div className="relative w-40 h-40 flex items-center justify-center">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/[0.03]" />
                 <motion.circle
                   cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent"
                   strokeDasharray={452.4}
                   initial={{ strokeDashoffset: 452.4 }}
                   animate={{ strokeDashoffset: 452.4 * (1 - displayHealth / 100) }}
                   transition={{ duration: 2, ease: "circOut" }}
                   className="text-brand-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                 />
               </svg>
               <div className="absolute flex flex-col items-center">
                 <span className="text-4xl font-black text-white tracking-tighter">{displayHealth}<span className="text-xl text-brand-500">%</span></span>
               </div>
             </div>
             
             <div className="mt-8 space-y-1">
               <div className="text-sm font-bold text-white">Clusters Optimized</div>
               <p className="text-[10px] text-slate-500 font-medium">All p3.xl instances running green</p>
             </div>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.1 }}
             className="glass-strong p-8 rounded-[32px] border border-white/10"
           >
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Logs</h3>
               <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
             </div>
             <div className="space-y-4">
               {recentLogs.length > 0 ? (
                 recentLogs.map((log, idx) => (
                   <div key={log.id || idx} className="flex gap-3 items-start group/log">
                     <div className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500 shadow-glow-brand group-hover/log:scale-150 transition-transform flex-shrink-0" />
                     <div className="min-w-0 flex-1">
                       <div className="text-[10px] font-black text-brand-400 uppercase tracking-widest truncate">{log.agent_role.split('_').join(' ')}</div>
                       <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{log.action}: {log.detail}</p>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-xs text-slate-500 text-center py-4">No neural activity recorded yet.</div>
               )}
             </div>
           </motion.div>
        </div>
      </div>

      <div className="space-y-6 pt-8">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/5" />
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] flex items-center gap-3">
            <Shield className="h-4 w-4 text-brand-500" />
            Specialized Neural Modules
          </h3>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <AgentGrid />
      </div>
    </div>
  )
}

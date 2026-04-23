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
    <div className="p-8 w-full max-w-full px-4 lg:px-16 space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <DashboardHeader 
          title="Neural Units" 
          subtitle="Specialized AI agents operating within your synchronized cluster." 
        />
        
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
                <h2 className="text-3xl font-black text-white tracking-tighter">Neural Core <span className="text-brand-500">V4.2</span></h2>
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
              { label: 'Active Shards', value: '05', sub: 'Synchronized' },
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
                   animate={{ strokeDashoffset: 452.4 * 0.02 }}
                   transition={{ duration: 2, ease: "circOut" }}
                   className="text-brand-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]" 
                 />
               </svg>
               <div className="absolute flex flex-col items-center">
                 <span className="text-4xl font-black text-white tracking-tighter">98<span className="text-xl text-brand-500">%</span></span>
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
                {[
                  { label: 'Reasoning', val: '450ms', trend: 'UP' },
                  { label: 'Retrieval', val: '1.2s', trend: 'STABLE' },
                  { label: 'Sync', val: '120ms', trend: 'DOWN' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col gap-1 group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</span>
                      <span className="text-xs font-mono text-white group-hover:text-brand-400 transition-colors">{item.val}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: item.label === 'Retrieval' ? '80%' : '40%' }}
                         className="h-full bg-brand-500/40 group-hover:bg-brand-500 transition-colors"
                       />
                    </div>
                  </div>
                ))}
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

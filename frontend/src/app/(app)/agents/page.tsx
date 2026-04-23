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
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <DashboardHeader 
          title="Neural Units" 
          subtitle="Specialized AI agents operating within your synchronized cluster." 
        />
        
        <div className="flex items-center gap-3 bg-surface-900/50 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => {
              setAgentsRunning(false)
              toast.success('All systems paused', {
                icon: '⏸️',
                style: { borderRadius: '12px', background: '#1a1a27', color: '#fff' }
              })
            }}
            disabled={!isAgentsRunning}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              isAgentsRunning ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "text-slate-600 cursor-not-allowed"
            )}
          >
            <Pause className="h-3.5 w-3.5" /> Pause All
          </button>
          <button 
            onClick={() => {
              setAgentsRunning(true)
              toast.success('Systems operational', {
                icon: '🚀',
                style: { borderRadius: '12px', background: '#1a1a27', color: '#fff' }
              })
            }}
            disabled={isAgentsRunning}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              !isAgentsRunning ? "bg-brand-500 text-white shadow-glow-brand" : "text-slate-600 cursor-not-allowed"
            )}
          >
            <Play className="h-3.5 w-3.5" /> Resume Units
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "glass-strong p-8 flex items-center justify-between relative overflow-hidden group border-2 transition-all duration-700",
          isAgentsRunning ? "border-brand-500/20" : "border-red-500/10"
        )}
      >
        <div className="relative z-10">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
             <Zap className={cn("h-4 w-4", isAgentsRunning ? "text-brand-400" : "text-red-400")} />
             Cluster Status
          </h3>
          <div className="text-4xl font-bold text-white mb-2 leading-none flex items-baseline gap-3">
            Neural Core V4
            <span className={cn(
              "text-xs font-black uppercase tracking-widest px-2 py-1 rounded",
              isAgentsRunning ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400 animate-pulse"
            )}>
              {isAgentsRunning ? 'Operational' : 'Paused'}
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-lg mt-4 font-medium leading-relaxed">
            {isAgentsRunning 
              ? "All agent processes are currently synchronized and executing. Real-time data synthesis is active across all sub-channels."
              : "All system processes have been halted. Click resume to restore operations and synchronize neural clusters."
            }
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-4 relative z-10">
           <div className="text-right mr-4">
             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Uptime</div>
             <div className="text-xl font-bold text-white tabular-nums">99.9%</div>
           </div>
           <div className="h-12 w-px bg-white/5" />
           <div className="text-right">
             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Latency</div>
             <div className="text-xl font-bold text-brand-400 tabular-nums">12ms</div>
           </div>
        </div>

        {/* Dynamic Background Glow */}
        <div className={cn(
          "absolute right-[-10%] top-[-50%] w-[400px] h-[400px] blur-[150px] transition-all duration-1000 opacity-20",
          isAgentsRunning ? "bg-brand-500" : "bg-red-500"
        )} />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-3 space-y-6">
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
            <Shield className="h-3 w-3" />
            Specialized Clusters
          </h3>
          <AgentGrid />
        </div>

        <div className="md:col-span-1 space-y-6">
           <div className="glass p-6">
             <h3 className="font-bold text-white text-xs mb-6 uppercase tracking-widest text-slate-500">Instance Health</h3>
             <div className="flex items-center justify-center py-4">
               <div className="relative w-24 h-24 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                   <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-800" />
                   <motion.circle 
                     cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" 
                     strokeDasharray={263.8}
                     initial={{ strokeDashoffset: 263.8 }}
                     animate={{ strokeDashoffset: 263.8 * 0.02 }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="text-brand-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                   />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                   <span className="text-xl font-black text-white">98%</span>
                 </div>
               </div>
             </div>
             <p className="text-[10px] text-center text-slate-500 mt-4 leading-relaxed line-clamp-2">
               Premium P3 clusters with multi-region redundancy active.
             </p>
           </div>

           <div className="glass p-6">
             <h3 className="font-bold text-white text-xs mb-6 uppercase tracking-widest text-slate-500">System Logs</h3>
             <div className="space-y-4">
                {[
                  { label: 'Reasoning', val: '450ms' },
                  { label: 'Retrieval', val: '1.2s' },
                  { label: 'Sync', val: '120ms' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{item.label}</span>
                    <span className="text-[10px] text-white font-mono">{item.val}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}

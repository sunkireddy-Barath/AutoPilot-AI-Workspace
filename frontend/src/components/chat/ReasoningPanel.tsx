'use client'

import { useStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Cpu, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReasoningPanel() {
  const { agentActivities } = useStore()
  
  // Filter for thinking activities
  const thinkingActivities = agentActivities.filter(a => a.action === 'Thinking' || a.action === 'Analysis').slice(0, 10)

  return (
    <div className="flex flex-col h-full bg-surface-900/50 backdrop-blur-xl border-l border-white/5 p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-brand-500 text-white shadow-glow-brand">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Neural Reasoning</h3>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Explaining AI logic in real-time</p>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence initial={false}>
          {thinkingActivities.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
              <Cpu className="h-12 w-12 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-center">Awaiting Neural Signals</p>
            </div>
          ) : (
            thinkingActivities.map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative pl-6 border-l border-white/10"
              >
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-brand-500 shadow-glow-brand" />
                
                <div className="flex items-center gap-2 mb-2">
                   <span className={cn(
                     "text-[9px] font-black uppercase tracking-widest",
                     activity.agent_role === 'product_manager' ? 'text-purple-400' :
                     activity.agent_role === 'developer' ? 'text-blue-400' :
                     activity.agent_role === 'marketing' ? 'text-orange-400' : 'text-green-400'
                   )}>
                     {activity.agent_role.replace('_', ' ')}
                   </span>
                   <div className="h-px flex-1 bg-white/5" />
                   <Sparkles className="h-3 w-3 text-brand-500/50" />
                </div>

                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors">
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                    {activity.detail}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Entropy</span>
          <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest">Stable</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
           <motion.div 
             animate={{ width: ['20%', '85%', '45%', '70%'] }}
             transition={{ duration: 10, repeat: Infinity }}
             className="h-full bg-brand-500/30" 
           />
        </div>
      </div>
    </div>
  )
}

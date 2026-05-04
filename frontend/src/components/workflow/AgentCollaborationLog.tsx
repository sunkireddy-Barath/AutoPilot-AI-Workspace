'use client'

import { useStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, ArrowRight, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export default function AgentCollaborationLog() {
  const { agentCollaborations } = useStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
          <Share2 className="h-4 w-4" />
        </div>
        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Neural Handoff Log</h3>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence initial={false}>
          {agentCollaborations.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No active handoffs</p>
            </div>
          ) : (
            agentCollaborations.map((collab, i) => (
              <motion.div
                key={collab.timestamp + i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-4 rounded-2xl border-white/5 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{collab.source.replace('_', ' ')}</span>
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                    <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest">{collab.target.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] text-slate-500 font-bold">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDistanceToNow(new Date(collab.timestamp))} ago
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{collab.message}"
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2 }}
                      className="h-full bg-indigo-500/30" 
                    />
                  </div>
                  <span className="text-[8px] font-black text-slate-600 uppercase">Synced</span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

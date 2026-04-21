'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function LoadingSplash() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface-900 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/5 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="relative z-10 w-24 h-24 rounded-[2rem] bg-brand-600 flex items-center justify-center shadow-glow-brand">
          <Zap className="w-12 h-12 text-white fill-white animate-pulse" />
        </div>
        
        {/* Animated rings */}
        <motion.div 
          className="absolute inset-0 rounded-[2rem] border-2 border-brand-500/30"
          animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div 
          className="absolute inset-0 rounded-[2rem] border-2 border-brand-500/20"
          animate={{ scale: [1, 1.8, 2.5], opacity: [0.3, 0.1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-10 text-center"
      >
        <h2 className="text-xl font-bold text-white tracking-[0.3em] uppercase">AutoPilot</h2>
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">Loading</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                  className="text-[10px] text-brand-400 font-bold"
                >
                  .
                </motion.span>
              ))}
            </div>
          </div>
          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Initializing Multi-Agent Engine</span>
        </div>
      </motion.div>
    </div>
  )
}

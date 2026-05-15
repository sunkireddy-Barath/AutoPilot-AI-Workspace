'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Target, Sparkles } from 'lucide-react'

export default memo(function GoalNode({ data, selected }: NodeProps) {
  const label = (data.label as string) || 'Primary Goal'

  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -3 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className="relative select-none"
    >
      {/* Animated outer glow */}
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -inset-2 rounded-[28px] bg-gradient-to-r from-brand-600/40 via-indigo-500/30 to-purple-600/40 blur-xl pointer-events-none"
      />

      <div
        className={`relative min-w-[240px] max-w-[300px] rounded-[24px] overflow-hidden border-2 transition-all duration-300 ${
          selected ? 'border-white/60' : 'border-white/20 hover:border-white/40'
        }`}
        style={{
          boxShadow: selected
            ? '0 0 40px rgba(99,102,241,0.6), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 0 24px rgba(99,102,241,0.35), 0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Multi-layer gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-brand-600 to-purple-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Glass top gloss */}
        <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none rounded-t-[24px]" />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 px-8 py-6 flex flex-col items-center gap-3 text-center">
          {/* Icon cluster */}
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-xl backdrop-blur-sm">
              <Target className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-400 border-2 border-white/20 flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </div>
          </div>

          {/* Labels */}
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">
              Primary Directive
            </div>
            <div className="text-[15px] font-black text-white leading-snug tracking-tight drop-shadow-md">
              {label}
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]"
            />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
              Active Goal
            </span>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-white/60 !border-2 !border-brand-600 !rounded-full"
          style={{ bottom: -6 }}
        />
      </div>
    </motion.div>
  )
})

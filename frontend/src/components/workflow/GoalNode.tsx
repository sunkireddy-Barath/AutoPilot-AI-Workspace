'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'

export default memo(function GoalNode({ data, selected }: NodeProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className={`px-8 py-4 rounded-[24px] bg-gradient-to-br from-brand-600 to-indigo-700 border-2 shadow-2xl relative overflow-hidden group cursor-pointer ${
        selected ? "border-white/50" : "border-white/20 hover:border-white/40"
      }`}
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center gap-1 text-center">
        <div className="text-3xl mb-1 drop-shadow-lg">🎯</div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-0.5">Primary Directive</div>
        <div className="text-lg font-black text-white tracking-tight leading-tight drop-shadow-md">
          {data.label}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-white border-2 border-brand-600" />
    </motion.div>
  )
})

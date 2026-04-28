'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { AgentRole } from '@/lib/store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const agentLabels: Record<string, string> = {
  product_manager: 'Product Manager',
  developer: 'Developer Agent',
  marketing: 'Marketing Agent',
  analyst: 'Analysis Agent',
  orchestrator: 'Orchestrator',
  operations: 'Operations Agent'
}

export default memo(function AgentNode({ data, selected }: NodeProps) {
  const role = data.role as string

  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className={cn(
        "w-48 h-16 rounded-full flex items-center justify-center text-center shadow-xl transition-all relative px-6",
        selected ? "bg-brand-600/20 border-2 border-brand-500 shadow-glow-brand text-brand-300" : "bg-surface-800 border-2 border-white/10 hover:border-brand-500/50 text-slate-200"
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <span className="text-xs font-bold tracking-wider uppercase leading-tight">
        {agentLabels[role] || 'Agent'}
      </span>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </motion.div>
  )
})

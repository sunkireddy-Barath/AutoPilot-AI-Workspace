'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { AgentRole } from '@/lib/store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const agentIcons: Record<AgentRole, string> = {
  product_manager: '🎯',
  developer: '💻',
  marketing: '📣',
  analyst: '📊',
  orchestrator: '🚀'
}

const agentLabels: Record<AgentRole, string> = {
  product_manager: 'Product Manager',
  developer: 'Developer',
  marketing: 'Marketing',
  analyst: 'Analyst',
  orchestrator: 'AutoPilot'
}

export default memo(function AgentNode({ data, selected }: NodeProps) {
  const role = data.role as AgentRole
  const status = data.status as string || 'idle'

  return (
    <div className={cn(
      "px-4 py-3 rounded-xl glass-strong border-2 min-w-[180px] transition-all",
      selected ? "border-brand-500 shadow-glow-brand" : "border-white/10"
    )}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-brand-500 border-none" />
      
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
          role === 'product_manager' ? "bg-agent-pm/20" :
          role === 'developer' ? "bg-agent-dev/20" :
          role === 'marketing' ? "bg-agent-marketing/20" :
          role === 'analyst' ? "bg-agent-analyst/20" : "bg-brand-500/20"
        )}>
          {agentIcons[role]}
        </div>
        
        <div>
          <div className="text-[10px] font-black uppercase tracking-tighter text-slate-500">Agent</div>
          <div className="text-sm font-bold text-white">{agentLabels[role]}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            status === 'thinking' ? "bg-yellow-400 animate-pulse" :
            status === 'active' ? "bg-green-400" : "bg-slate-500"
          )} />
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{status}</span>
        </div>
        
        {status === 'thinking' && (
          <motion.div 
            className="flex gap-0.5"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {[0, 1, 2].map(i => (
              <div key={i} className="w-0.5 h-2 bg-brand-500/50 rounded-full" />
            ))}
          </motion.div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-brand-500 border-none" />
    </div>
  )
})

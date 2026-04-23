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
  orchestrator: '🚀',
  operations: '⚙️'
}

const agentLabels: Record<AgentRole, string> = {
  product_manager: 'Product Manager',
  developer: 'Developer',
  marketing: 'Marketing',
  analyst: 'Analyst',
  orchestrator: 'AutoPilot',
  operations: 'Operations'
}

export default memo(function AgentNode({ data, selected }: NodeProps) {
  const role = data.role as AgentRole
  const status = data.status as string || 'idle'

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "px-5 py-4 rounded-2xl glass-strong border-2 min-w-[200px] transition-all relative overflow-hidden group cursor-pointer",
        selected ? "border-brand-500/50 shadow-glow-brand" : "border-white/10 shadow-xl hover:border-brand-500/30",
        status === 'thinking' && "ring-2 ring-yellow-400/30 ring-offset-2 ring-offset-surface-900"
      )}
    >
      {/* Background Animated Gradient for Thinking State */}
      {status === 'thinking' && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-yellow-400/5"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-brand-500 border-2 border-surface-900" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner",
          role === 'product_manager' ? "bg-agent-pm/20 text-agent-pm" :
          role === 'developer' ? "bg-agent-dev/20 text-agent-dev" :
          role === 'marketing' ? "bg-agent-marketing/20 text-agent-marketing" :
          role === 'analyst' ? "bg-agent-analyst/20 text-agent-analyst" : "bg-brand-500/20 text-brand-400"
        )}>
          {agentIcons[role]}
        </div>
        
        <div className="flex-1">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Agent Node</div>
          <div className="text-base font-bold text-white tracking-tight leading-tight">{agentLabels[role]}</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full shadow-sm",
              status === 'thinking' ? "bg-yellow-400" :
              status === 'active' ? "bg-green-400" : "bg-slate-500"
            )} />
            {status === 'thinking' && (
              <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75" />
            )}
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            status === 'thinking' ? "text-yellow-400/80" :
            status === 'active' ? "text-green-400/80" : "text-slate-500"
          )}>{status}</span>
        </div>
        
        {status === 'thinking' && (
          <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-1 h-1 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 h-1 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-brand-500 border-2 border-surface-900" />
    </motion.div>
  )
})

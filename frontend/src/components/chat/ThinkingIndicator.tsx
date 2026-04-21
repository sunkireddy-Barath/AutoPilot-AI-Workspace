'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { AgentRole } from '@/lib/store'
import { cn } from '@/lib/utils'

const agentLabels: Record<string, string> = {
  product_manager: 'Product Manager',
  developer: 'Developer',
  marketing: 'Marketing',
  analyst: 'Analyst',
  orchestrator: 'AutoPilot'
}

const agentColors: Record<string, string> = {
  product_manager: 'bg-agent-pm',
  developer: 'bg-agent-dev',
  marketing: 'bg-agent-marketing',
  analyst: 'bg-agent-analyst',
  orchestrator: 'bg-brand-500'
}

const agentTextColors: Record<string, string> = {
  product_manager: 'text-agent-pm',
  developer: 'text-agent-dev',
  marketing: 'text-agent-marketing',
  analyst: 'text-agent-analyst',
  orchestrator: 'text-brand-400'
}

interface ThinkingIndicatorProps {
  role: AgentRole
}

export default function ThinkingIndicator({ role }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5 w-fit ml-6">
      <div className="relative">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center opacity-20", agentColors[role] || 'bg-brand-500')} />
        <Zap className={cn("absolute inset-0 m-auto h-4 w-4 animate-pulse", agentTextColors[role] || 'text-brand-400')} />
      </div>
      
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {agentLabels[role]} 
        </span>
        <span className="text-sm font-semibold text-white">
          Thinking...
        </span>
      </div>

      <div className="flex gap-1 ml-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn("w-1 h-1 rounded-full", agentColors[role] || 'bg-brand-500')}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}

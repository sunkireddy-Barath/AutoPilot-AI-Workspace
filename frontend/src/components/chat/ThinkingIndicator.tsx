'use client'

import { motion } from 'framer-motion'
import { AgentRole } from '@/lib/store'
import { cn } from '@/lib/utils'

const agentLabels: Record<AgentRole, string> = {
  product_manager: 'Product Manager',
  developer: 'Developer',
  marketing: 'Marketing',
  analyst: 'Analyst',
  orchestrator: 'AutoPilot'
}

const agentColors: Record<AgentRole, string> = {
  product_manager: 'bg-agent-pm',
  developer: 'bg-agent-dev',
  marketing: 'bg-agent-marketing',
  analyst: 'bg-agent-analyst',
  orchestrator: 'bg-brand-500'
}

interface ThinkingIndicatorProps {
  role: AgentRole
}

export default function ThinkingIndicator({ role }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5 w-fit ml-6 animate-pulse">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn("w-1.5 h-1.5 rounded-full", agentColors[role] || 'bg-brand-500')}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        {agentLabels[role]} is thinking...
      </span>
    </div>
  )
}

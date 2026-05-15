'use client'

import { motion } from 'framer-motion'
import { AgentRole } from '@/lib/store'
import { Brain, Code2, Megaphone, BarChart3, Zap, Settings2 } from 'lucide-react'

const agentConfig: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  product_manager: { label: 'Product Manager', Icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  developer: { label: 'Developer', Icon: Code2, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  marketing: { label: 'Marketing', Icon: Megaphone, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  analyst: { label: 'Analyst', Icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  orchestrator: { label: 'AutoPilot', Icon: Zap, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
  operations: { label: 'Operations', Icon: Settings2, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
}

interface ThinkingIndicatorProps {
  role: AgentRole
}

export default function ThinkingIndicator({ role }: ThinkingIndicatorProps) {
  const cfg = agentConfig[role] || agentConfig.orchestrator
  const { Icon } = cfg

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-center gap-4 py-4 px-6"
    >
      <div className={`relative p-2.5 rounded-xl border ${cfg.bg} shrink-0`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`absolute inset-0 rounded-xl border ${cfg.bg}`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
          {cfg.label}
        </span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`h-1 rounded-full ${cfg.color.replace('text-', 'bg-')}`}
              animate={{ width: ['6px', '20px', '6px'], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

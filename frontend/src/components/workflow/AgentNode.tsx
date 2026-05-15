'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Brain, Code2, Megaphone, BarChart3, Zap, Settings2 } from 'lucide-react'

const agentConfig: Record<string, {
  label: string
  subtitle: string
  Icon: any
  gradient: string
  border: string
  glow: string
  dotColor: string
  iconBg: string
}> = {
  orchestrator: {
    label: 'Orchestrator',
    subtitle: 'Central Command',
    Icon: Zap,
    gradient: 'from-indigo-900/90 via-indigo-800/80 to-purple-900/90',
    border: 'border-indigo-500/60',
    glow: '0 0 32px rgba(99,102,241,0.5)',
    dotColor: '#6366f1',
    iconBg: 'bg-indigo-500/20 border-indigo-500/30',
  },
  product_manager: {
    label: 'Product Manager',
    subtitle: 'Strategy & Planning',
    Icon: Brain,
    gradient: 'from-violet-900/90 via-purple-800/80 to-fuchsia-900/90',
    border: 'border-violet-500/60',
    glow: '0 0 32px rgba(139,92,246,0.5)',
    dotColor: '#8B5CF6',
    iconBg: 'bg-violet-500/20 border-violet-500/30',
  },
  developer: {
    label: 'Developer',
    subtitle: 'Build & Architecture',
    Icon: Code2,
    gradient: 'from-cyan-900/90 via-sky-800/80 to-blue-900/90',
    border: 'border-cyan-500/60',
    glow: '0 0 32px rgba(6,182,212,0.5)',
    dotColor: '#06B6D4',
    iconBg: 'bg-cyan-500/20 border-cyan-500/30',
  },
  marketing: {
    label: 'Marketing',
    subtitle: 'Growth & Campaigns',
    Icon: Megaphone,
    gradient: 'from-amber-900/90 via-orange-800/80 to-yellow-900/90',
    border: 'border-amber-500/60',
    glow: '0 0 32px rgba(245,158,11,0.5)',
    dotColor: '#F59E0B',
    iconBg: 'bg-amber-500/20 border-amber-500/30',
  },
  analyst: {
    label: 'Analyst',
    subtitle: 'Insights & KPIs',
    Icon: BarChart3,
    gradient: 'from-emerald-900/90 via-teal-800/80 to-green-900/90',
    border: 'border-emerald-500/60',
    glow: '0 0 32px rgba(16,185,129,0.5)',
    dotColor: '#10B981',
    iconBg: 'bg-emerald-500/20 border-emerald-500/30',
  },
  operations: {
    label: 'Operations',
    subtitle: 'Systems & Infra',
    Icon: Settings2,
    gradient: 'from-pink-900/90 via-rose-800/80 to-red-900/90',
    border: 'border-pink-500/60',
    glow: '0 0 32px rgba(236,72,153,0.5)',
    dotColor: '#EC4899',
    iconBg: 'bg-pink-500/20 border-pink-500/30',
  },
}

export default memo(function AgentNode({ data, selected }: NodeProps) {
  const role = (data.role as string) || 'orchestrator'
  const status = (data.status as string) || 'idle'
  const cfg = agentConfig[role] || agentConfig.orchestrator
  const { Icon } = cfg

  const isThinking = status === 'thinking'
  const isActive = status === 'active'
  const isLive = isThinking || isActive

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative select-none"
      style={{ filter: isLive ? `drop-shadow(${cfg.glow})` : undefined }}
    >
      {/* Pulse ring when active/thinking */}
      {isLive && (
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={cn('absolute inset-0 rounded-2xl border-2', cfg.border)}
        />
      )}

      <div
        className={cn(
          'relative w-48 rounded-2xl overflow-hidden border-2 transition-all duration-300',
          cfg.border,
          selected && 'ring-2 ring-white/40 ring-offset-1 ring-offset-transparent'
        )}
        style={{ boxShadow: selected || isLive ? cfg.glow : '0 4px 24px rgba(0,0,0,0.4)' }}
      >
        {/* Gradient background */}
        <div className={cn('absolute inset-0 bg-gradient-to-br', cfg.gradient)} />
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
        {/* Top gloss */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

        <Handle type="target" position={Position.Top} className="!opacity-0 !pointer-events-none !w-0 !h-0" />

        <div className="relative z-10 p-4 flex flex-col items-center gap-3">
          {/* Icon circle */}
          <div className="relative">
            {isLive && (
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="absolute inset-0 rounded-full"
                style={{ background: `radial-gradient(circle, ${cfg.dotColor}60, transparent 70%)` }}
              />
            )}
            <div className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center border shadow-lg',
              cfg.iconBg
            )}>
              <Icon className="h-5 w-5 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Labels */}
          <div className="text-center">
            <div className="text-[8px] font-black uppercase tracking-[0.25em] text-white/40 mb-0.5">
              AI Agent
            </div>
            <div className="text-[13px] font-bold text-white leading-tight tracking-tight">
              {cfg.label}
            </div>
            <div className="text-[9px] text-white/40 font-medium mt-0.5">
              {cfg.subtitle}
            </div>
          </div>

          {/* Status pill */}
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest w-full justify-center',
            isThinking && 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10',
            isActive && 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
            status === 'completed' && 'border-blue-500/30 text-blue-300 bg-blue-500/10',
            status === 'idle' && 'border-white/10 text-white/30 bg-white/5',
          )}>
            <div className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              isThinking && 'bg-yellow-400 animate-pulse',
              isActive && 'bg-emerald-400 animate-pulse',
              status === 'completed' && 'bg-blue-400',
              status === 'idle' && 'bg-white/20',
            )} />
            {isThinking ? 'Thinking...' : isActive ? 'Active' : status}
          </div>
        </div>

        <Handle type="source" position={Position.Bottom} className="!opacity-0 !pointer-events-none !w-0 !h-0" />
      </div>
    </motion.div>
  )
})

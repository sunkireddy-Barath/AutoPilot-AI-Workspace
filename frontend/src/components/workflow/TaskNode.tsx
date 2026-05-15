'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, Circle, AlertCircle, User2 } from 'lucide-react'
import { motion } from 'framer-motion'

const agentColors: Record<string, string> = {
  product_manager: 'text-violet-400',
  developer: 'text-cyan-400',
  marketing: 'text-amber-400',
  analyst: 'text-emerald-400',
  orchestrator: 'text-indigo-400',
  operations: 'text-pink-400',
}

const statusConfig = {
  pending: {
    Icon: Circle,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20',
    bar: 'bg-slate-500',
    label: 'Pending',
  },
  in_progress: {
    Icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    bar: 'bg-blue-500',
    label: 'In Progress',
  },
  completed: {
    Icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    bar: 'bg-emerald-500',
    label: 'Completed',
  },
  blocked: {
    Icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    bar: 'bg-red-500',
    label: 'Blocked',
  },
}

const priorityConfig = {
  critical: { label: 'Critical', cls: 'border-red-500/30 text-red-400 bg-red-500/8' },
  high: { label: 'High', cls: 'border-orange-500/30 text-orange-400 bg-orange-500/8' },
  medium: { label: 'Medium', cls: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/8' },
  low: { label: 'Low', cls: 'border-slate-500/20 text-slate-500 bg-slate-500/8' },
}

export default memo(function TaskNode({ data, selected }: NodeProps) {
  const status = (data.status as string) || 'pending'
  const title = (data.title as string) || 'New Task'
  const priority = (data.priority as string) || 'medium'
  const progress = (data.progress as number) || 0
  const assignedAgent = data.assigned_agent as string | undefined

  const sc = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  const pc = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
  const { Icon } = sc

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative select-none"
    >
      <div
        className={cn(
          'relative min-w-[230px] max-w-[260px] rounded-2xl overflow-hidden border-2 transition-all duration-300',
          selected
            ? 'border-brand-500/60 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
            : 'border-white/8 hover:border-white/20'
        )}
        style={{ boxShadow: selected ? undefined : '0 4px 24px rgba(0,0,0,0.3)' }}
      >
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-800/95 to-surface-900/95 backdrop-blur-md" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

        {/* Left status accent bar */}
        <div className={cn('absolute top-0 left-0 w-1 h-full', sc.bar)} />

        <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-600 !border-none !rounded-full" style={{ top: -4 }} />

        <div className="relative z-10 p-4 pl-5 flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={cn('p-1 rounded-lg shrink-0', sc.bg)}>
                <Icon className={cn('h-3.5 w-3.5', sc.color)} />
              </div>
              <div className="min-w-0">
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Task</div>
                <div className="text-[12px] font-bold text-white leading-tight truncate">{title}</div>
              </div>
            </div>

            {/* Priority badge */}
            <div className={cn(
              'shrink-0 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest',
              pc.cls
            )}>
              {pc.label}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
              <span className={cn('text-[10px] font-black', sc.color)}>{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full rounded-full', sc.bar)}
              />
            </div>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between">
            {assignedAgent ? (
              <div className="flex items-center gap-1.5">
                <User2 className={cn('h-3 w-3', agentColors[assignedAgent] || 'text-slate-500')} />
                <span className={cn('text-[9px] font-bold capitalize', agentColors[assignedAgent] || 'text-slate-500')}>
                  {assignedAgent.replace('_', ' ')}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="text-[9px] text-slate-600 font-medium">Unassigned</span>
              </div>
            )}

            <div className={cn(
              'text-[8px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest',
              sc.bg, sc.color
            )}>
              {sc.label}
            </div>
          </div>
        </div>

        <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-600 !border-none !rounded-full" style={{ bottom: -4 }} />
      </div>
    </motion.div>
  )
})

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore, AgentActivity, AgentRole } from '@/lib/store'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, CircleDashed, Loader2, AlertCircle } from 'lucide-react'

const agentColors: Record<AgentRole, string> = {
  product_manager: '#8B5CF6',
  developer: '#06B6D4',
  marketing: '#F59E0B',
  analyst: '#10B981',
  orchestrator: '#6366f1',
  operations: '#EC4899'
}

const agentAvatars: Record<AgentRole, string> = {
  product_manager: '🎯',
  developer: '💻',
  marketing: '📣',
  analyst: '📊',
  orchestrator: '🚀',
  operations: '⚙️'
}

const StatusIcon = ({ status, color }: { status: string; color: string }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4" style={{ color }} />
    case 'thinking':
    case 'active':
      return <Loader2 className="h-4 w-4 animate-spin" style={{ color }} />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    default:
      return <CircleDashed className="h-4 w-4" style={{ color }} />
  }
}

export default function AgentActivityTimeline() {
  const { agentActivities } = useStore()

  // For visual appeal, if there are no activities yet, we can show a placeholder or just a message.
  if (!agentActivities || agentActivities.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-white/5 rounded-3xl glass-panel relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent pointer-events-none" />
        <CircleDashed className="h-8 w-8 text-slate-600 mb-4 animate-[spin_4s_linear_infinite]" />
        <h3 className="text-white font-bold tracking-wide">Awaiting Goal Execution</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-[200px]">
          Submit a goal in the Command Center to watch the AI cluster orchestrate the workflow in real-time.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full glass-panel border border-white/5 rounded-3xl overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-surface-900/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500 shadow-glow-brand animate-pulse-soft" />
            Live Execution Stream
          </h2>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-0.5">
            Agent Reasoning & Actions
          </p>
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-none relative">
        {/* Continuous Line */}
        <div className="absolute left-[39px] top-6 bottom-6 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

        <div className="space-y-6 relative">
          <AnimatePresence initial={false}>
            {agentActivities.map((activity, index) => {
              const color = agentColors[activity.agent_role] || '#94a3b8'
              const avatar = agentAvatars[activity.agent_role] || '🤖'
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex gap-4 group"
                >
                  {/* Timeline Node */}
                  <div className="relative flex flex-col items-center">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-xl z-10 border border-white/10"
                      style={{ backgroundColor: `${color}20`, color: color }}
                    >
                      {avatar}
                    </div>
                    {/* Active pulse effect if thinking/active and is the first item (most recent) */}
                    {index === 0 && (activity.status === 'thinking' || activity.status === 'active') && (
                      <div 
                        className="absolute inset-0 rounded-xl animate-ping opacity-50 z-0"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color }}
                        >
                          {activity.agent_role.replace('_', ' ')}
                        </span>
                        <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-slate-400 flex items-center gap-1">
                          <StatusIcon status={activity.status} color={color} />
                          <span className="uppercase tracking-wider">{activity.action}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap ml-4">
                        {formatDistanceToNow(new Date(activity.timestamp))} ago
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-300 bg-surface-800/50 p-3 rounded-2xl border border-white/5 font-mono text-xs leading-relaxed">
                      {activity.detail}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

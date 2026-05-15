'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Message, AgentRole } from '@/lib/store'
import { cn } from '@/lib/utils'
import { User, Brain, Code2, Megaphone, BarChart3, Zap, Settings2, ShieldCheck } from 'lucide-react'
import ArtifactRenderer from './ArtifactRenderer'

const agentConfig: Record<AgentRole, { label: string; Icon: any; color: string; border: string; glow: string }> = {
  product_manager: {
    label: 'Product Manager',
    Icon: Brain,
    color: 'text-violet-400 bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: 'shadow-[0_0_12px_rgba(139,92,246,0.2)]',
  },
  developer: {
    label: 'Developer',
    Icon: Code2,
    color: 'text-cyan-400 bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-[0_0_12px_rgba(6,182,212,0.2)]',
  },
  marketing: {
    label: 'Marketing',
    Icon: Megaphone,
    color: 'text-amber-400 bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
  },
  analyst: {
    label: 'Analyst',
    Icon: BarChart3,
    color: 'text-emerald-400 bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]',
  },
  orchestrator: {
    label: 'AutoPilot',
    Icon: Zap,
    color: 'text-brand-400 bg-brand-500/10',
    border: 'border-brand-500/20',
    glow: 'shadow-[0_0_12px_rgba(99,102,241,0.2)]',
  },
  operations: {
    label: 'Operations',
    Icon: Settings2,
    color: 'text-pink-400 bg-pink-500/10',
    border: 'border-pink-500/20',
    glow: 'shadow-[0_0_12px_rgba(236,72,153,0.2)]',
  },
}

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const cfg = message.agent_role ? agentConfig[message.agent_role as AgentRole] : agentConfig.orchestrator
  const { Icon } = cfg

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex w-full gap-4 px-2 py-4 transition-all',
        isUser
          ? 'flex-row-reverse'
          : ''
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="h-8 w-8 rounded-xl bg-surface-600 flex items-center justify-center border border-white/8">
            <User className="h-4 w-4 text-slate-400" />
          </div>
        ) : (
          <div className={cn(
            'h-8 w-8 rounded-xl flex items-center justify-center border shadow-sm',
            cfg.color, cfg.border, cfg.glow
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col gap-2 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        {/* Header */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-bold text-white">
            {isUser
              ? 'You'
              : `MeDo ${cfg.label} Agent`}
          </span>
          {!isUser && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-500/10 text-brand-400 text-[9px] font-black uppercase tracking-tighter border border-brand-500/15">
              <ShieldCheck className="h-2.5 w-2.5" />
              Verified AI
            </span>
          )}
          <span className="text-[10px] text-slate-600 font-medium ml-1">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Content bubble */}
        <div className={cn(
          'rounded-2xl px-4 py-3 text-[13px] leading-relaxed font-medium',
          isUser
            ? 'bg-brand-600/20 border border-brand-500/25 text-slate-100 rounded-tr-sm'
            : 'bg-white/[0.03] border border-white/[0.06] text-slate-200 rounded-tl-sm'
        )}>
          <div className={cn(
            'prose prose-invert prose-sm max-w-none',
            'prose-p:leading-relaxed prose-p:my-1',
            'prose-pre:bg-surface-800 prose-pre:border prose-pre:border-white/8 prose-pre:rounded-xl prose-pre:text-xs',
            'prose-code:text-brand-300 prose-code:bg-brand-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[12px]',
            'prose-strong:text-white prose-strong:font-bold',
            'prose-h1:text-white prose-h1:font-black prose-h1:text-base prose-h1:mt-3 prose-h1:mb-2',
            'prose-h2:text-white prose-h2:font-bold prose-h2:text-sm prose-h2:mt-3 prose-h2:mb-2',
            'prose-h3:text-slate-200 prose-h3:font-bold prose-h3:text-xs prose-h3:mt-2 prose-h3:mb-1',
            'prose-li:text-slate-300 prose-li:marker:text-brand-400',
            'prose-blockquote:border-brand-500/40 prose-blockquote:text-slate-400',
          )}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {/* Structured artifact */}
          {Boolean(message.metadata?.artifact) && (
            <ArtifactRenderer
              type={(message.metadata?.artifact as any).type}
              data={(message.metadata?.artifact as any).data}
            />
          )}

          {/* Task count badge */}
          {Boolean(message.metadata?.task_count) && (
            <div className="mt-3 flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                {String(message.metadata?.task_count)} Tasks Generated
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

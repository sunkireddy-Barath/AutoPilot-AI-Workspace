'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Message, AgentRole } from '@/lib/store'
import { cn } from '@/lib/utils'
import { User, ShieldCheck } from 'lucide-react'

const agentAvatars: Record<AgentRole, string> = {
  product_manager: '🎯',
  developer: '💻',
  marketing: '📣',
  analyst: '📊',
  orchestrator: '🚀',
  operations: '⚙️'
}

const agentColors: Record<AgentRole, string> = {
  product_manager: 'text-agent-pm bg-agent-pm/10',
  developer: 'text-agent-dev bg-agent-dev/10',
  marketing: 'text-agent-marketing bg-agent-marketing/10',
  analyst: 'text-agent-analyst bg-agent-analyst/10',
  orchestrator: 'text-brand-400 bg-brand-400/10',
  operations: 'text-pink-400 bg-pink-400/10'
}

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full gap-4 p-6 transition-all duration-200",
        isUser ? "bg-white/[0.02]" : "bg-transparent"
      )}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="h-10 w-10 rounded-xl bg-surface-600 flex items-center justify-center border border-white/5">
            <User className="h-5 w-5 text-slate-400" />
          </div>
        ) : (
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center text-xl border border-white/10 shadow-lg",
            message.agent_role ? agentColors[message.agent_role as AgentRole] : "bg-surface-800"
          )}>
            {message.agent_role ? agentAvatars[message.agent_role as AgentRole] : '🤖'}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">
            {isUser ? 'You' : (message.agent_role ? message.agent_role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'MeDO')}
          </span>
          {!isUser && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 text-[10px] font-black uppercase tracking-tighter border border-brand-500/20">
              <ShieldCheck className="h-2.5 w-2.5" />
              Verified AI
            </div>
          )}
          <span className="text-[10px] text-slate-500 font-medium ml-auto">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className={cn(
          "prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-surface-800 prose-pre:border prose-pre:border-white/5",
          isUser ? "text-slate-300" : "text-slate-200"
        )}>
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        </div>

        {Boolean(message.metadata?.task_count) && (
          <div className="mt-4 flex items-center gap-2">
            <div className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1.5">
              🚀 {String(message.metadata?.task_count)} Tasks Generated
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Calendar, User, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { Task, AgentRole } from '@/lib/store'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

const agentColors: Record<AgentRole, string> = {
  product_manager: '#8B5CF6',
  developer: '#06B6D4',
  marketing: '#F59E0B',
  analyst: '#10B981',
  orchestrator: '#6366f1'
}

interface TaskItemProps {
  task: Task
  index: number
}

export default function TaskItem({ task, index }: TaskItemProps) {
  const StatusIcon = {
    pending: Circle,
    in_progress: Clock,
    completed: CheckCircle2,
    blocked: AlertCircle
  }[task.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        delay: index * 0.05,
        backgroundColor: { duration: 0.2 } 
      }}
      className="p-4 group flex items-start gap-4 border-b border-white/5 last:border-0 cursor-pointer transition-colors"
    >
      <div className={cn(
        "mt-1 p-1 rounded-full",
        task.status === 'completed' ? "text-green-400" : 
        task.status === 'in_progress' ? "text-blue-400" :
        task.status === 'blocked' ? "text-red-400" : "text-slate-500"
      )}>
        <StatusIcon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white truncate">{task.title}</h4>
          {task.metadata?.artifact_path && (
            <button className="text-[10px] font-bold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
              VIEW ARTIFACT
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mt-1">{task.description}</p>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            <User className="h-3 w-3" />
            <span style={{ color: task.assigned_agent ? agentColors[task.assigned_agent as AgentRole] : '#94a3b8' }}>
              {task.assigned_agent ? task.assigned_agent.replace('_', ' ') : 'Unassigned'}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            <Calendar className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(task.created_at))} ago</span>
          </div>

          <div className={cn(
            "text-[9px] uppercase font-black px-2 py-0.5 rounded border tracking-tighter",
            task.priority === 'high' || task.priority === 'critical' 
              ? "border-red-500/20 text-red-400 bg-red-500/10" 
              : task.priority === 'medium'
              ? "border-yellow-500/20 text-yellow-400 bg-yellow-500/10"
              : "border-slate-500/20 text-slate-400 bg-slate-500/10"
          )}>
            {task.priority}
          </div>
        </div>
      </div>

      <div className="hidden sm:block w-24">
        <div className="h-1.5 w-full bg-surface-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-brand-500" 
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
          />
        </div>
        <div className="text-[10px] text-slate-500 text-right mt-1 font-medium">{task.progress}%</div>
      </div>
    </motion.div>
  )
}

'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, Circle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default memo(function TaskNode({ data, selected }: NodeProps) {
  const status = data.status as string || 'pending'
  const title = data.title as string || 'New Task'
  const priority = data.priority as string || 'medium'
  const progress = data.progress as number || 0

  const StatusIcon = {
    pending: Circle,
    in_progress: Clock,
    completed: CheckCircle2,
    blocked: AlertCircle
  }[status] || Circle

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "px-4 py-3 rounded-xl glass border-2 min-w-[220px] transition-all cursor-pointer",
        selected ? "border-brand-500 shadow-glow-brand" : "border-white/5 hover:border-brand-500/30"
      )}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-slate-500 border-none" />
      
      <div className="flex items-start gap-3">
        <div className={cn(
          "mt-1 p-1 rounded-full",
          status === 'completed' ? "text-green-400" :
          status === 'in_progress' ? "text-blue-400" :
          status === 'blocked' ? "text-red-400" : "text-slate-500"
        )}>
          <StatusIcon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-black uppercase tracking-tighter text-slate-500 mb-0.5">Task Node</div>
          <div className="text-xs font-bold text-white truncate pr-4">{title}</div>
          
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="flex-1 h-1 bg-surface-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  status === 'completed' ? "bg-green-500" : "bg-brand-500"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[9px] font-bold text-slate-500">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className={cn(
          "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border tracking-widest",
          priority === 'high' || priority === 'critical' ? "border-red-500/20 text-red-500 bg-red-500/5" :
          priority === 'medium' ? "border-yellow-500/20 text-yellow-500 bg-yellow-500/5" :
          "border-slate-500/20 text-slate-400 bg-slate-500/5"
        )}>
          {priority}
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Auto-planned</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-slate-500 border-none" />
    </motion.div>
  )
})

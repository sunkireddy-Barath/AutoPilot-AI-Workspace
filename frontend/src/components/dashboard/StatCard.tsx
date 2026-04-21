'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
}

export default function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass p-6 flex flex-col gap-4 relative overflow-hidden group"
    >
      <div 
        className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 pointer-events-none -translate-y-12 translate-x-12"
        style={{ backgroundColor: color }}
      />
      
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-lg bg-surface-700", `text-${color}`)}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        {trend && (
          <div className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.positive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          )}>
            {trend.positive ? '+' : ''}{trend.value}% {trend.label}
          </div>
        )}
      </div>

      <div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm font-medium text-slate-400 tracking-wide uppercase">{label}</div>
      </div>
    </motion.div>
  )
}

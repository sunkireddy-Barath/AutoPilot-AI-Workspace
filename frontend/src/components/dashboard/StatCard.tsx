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

import RollingNumber from '@/components/ui/RollingNumber'

export default function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="p-6 flex flex-col gap-4 relative h-full">
      <div 
        className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 pointer-events-none -translate-y-12 translate-x-12"
        style={{ backgroundColor: color }}
      />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && (
          <div className={cn(
            "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter",
            trend.positive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          )}>
            {trend.positive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>

      <div className="relative z-10">
        <div className="text-3xl font-black text-white mb-1 tabular-nums">
          <RollingNumber value={value} />
        </div>
        <div className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">{label}</div>
      </div>
    </div>
  )
}

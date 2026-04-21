'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface InsightChartProps {
  label: string
  data: number[]
  color: string
}

export default function InsightChart({ label, data, color }: InsightChartProps) {
  const max = Math.max(...data)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</h4>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[10px] text-slate-400 font-bold">LIVE STREAM</span>
        </div>
      </div>
      
      <div className="h-32 flex items-end gap-1.5 px-1 py-1 bg-surface-800/50 rounded-xl border border-white/5 overflow-hidden">
        {data.map((val, i) => {
          const height = (val / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col justify-end group transition-all">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 1, delay: i * 0.05 }}
                className="w-full rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                style={{ backgroundColor: `${color}cc` }}
              />
            </div>
          )
        })}
      </div>

      <div className="flex justify-between text-[10px] text-slate-600 font-black tracking-tighter">
        <span>T-24H</span>
        <span>CURRENT PEAK</span>
      </div>
    </div>
  )
}

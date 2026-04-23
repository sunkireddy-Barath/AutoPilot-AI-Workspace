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
    <div className="space-y-4 group/chart">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover/chart:text-slate-300 transition-colors">{label}</h4>
        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/[0.03] border border-white/5">
          <div className="h-1 w-1 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Live Matrix</span>
        </div>
      </div>
      
      <div className="h-40 relative flex items-end gap-2 px-4 py-4 bg-white/[0.02] rounded-3xl border border-white/5 overflow-hidden group/canvas">
        {/* Scanline Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.01] to-transparent h-1/2 w-full -translate-y-full group-hover/canvas:animate-[shimmer_4s_infinite] pointer-events-none" />
        
        {data.map((val, i) => {
          const height = (val / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col justify-end group/bar transition-all h-full">
              <div className="relative w-full">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 1.5, delay: i * 0.05, ease: "circOut" }}
                  className="w-full rounded-full transition-all duration-500 group-hover/bar:brightness-150 group-hover/bar:shadow-lg relative overflow-hidden"
                  style={{ backgroundColor: `${color}40`, border: `1px solid ${color}20` }}
                >
                  {/* Subtle highlight on each bar */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                </motion.div>
                
                {/* Value tooltip on hover */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded bg-surface-900 border border-white/10">{val}</span>
                </div>
              </div>
            </div>
          )
        })}

        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
          <div className="h-px w-full bg-white/5" />
          <div className="h-px w-full bg-white/5" />
          <div className="h-px w-full bg-white/5" />
        </div>
      </div>

      <div className="flex justify-between items-center text-[9px] text-slate-600 font-bold tracking-widest uppercase">
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-slate-700" />
          <span>T-24H Period</span>
        </div>
        <div className="flex items-center gap-1.5 text-brand-400">
          <span>Peak Signal</span>
          <div className="h-1 w-1 rounded-full bg-brand-500" />
        </div>
      </div>
    </div>
  )
}

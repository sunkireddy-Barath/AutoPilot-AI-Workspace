'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Plus, Bell, Search } from 'lucide-react'

interface DashboardHeaderProps {
  title: string
  subtitle: string
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-brand-500/50" />
          <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em]">Integrated Intelligence Environment</span>
        </div>
        <motion.h1 
          className="text-5xl font-black text-white tracking-tighter"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {title}
        </motion.h1>
        <motion.p 
          className="text-slate-500 font-medium text-lg leading-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {subtitle}
        </motion.p>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/chat')}
          className="flex items-center gap-3 h-14 px-8 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all active:scale-95 shadow-2xl shadow-white/5"
        >
          <Plus className="h-5 w-5" />
          <span>Initiate Neural Goal</span>
        </button>
      </div>
    </div>
  )
}

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

      <div className="flex items-center gap-3">
        <div className="relative group flex-1 md:flex-none">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search Intelligence..." 
            className="bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white w-full md:w-72 outline-none focus:border-brand-500/30 focus:bg-white/[0.05] transition-all backdrop-blur-md"
          />
        </div>
        
        <button className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all relative group backdrop-blur-md">
          <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-brand-500 border-2 border-[#050508]" />
        </button>

        <button 
          onClick={() => router.push('/chat')}
          className="flex items-center gap-2 h-12 px-6 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all active:scale-95 shadow-xl"
        >
          <Plus className="h-4 w-4" />
          <span>Launch Goal</span>
        </button>
      </div>
    </div>
  )
}

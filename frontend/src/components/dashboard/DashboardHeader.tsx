'use client'

import { motion } from 'framer-motion'
import { Plus, Bell, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  title: string
  subtitle: string
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <motion.h1 
          className="text-3xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {title}
        </motion.h1>
        <motion.p 
          className="text-slate-400 mt-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {subtitle}
        </motion.p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group flex-1 md:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search tasks, workflows..." 
            className="bg-surface-800 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white w-full md:w-64 outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
        
        <button className="p-2.5 rounded-xl bg-surface-800 border border-white/5 text-slate-400 hover:text-white hover:bg-surface-700 transition-all relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand-500 border-2 border-surface-800" />
        </button>

        <button 
          onClick={() => router.push('/chat')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </button>
      </div>
    </div>
  )
}

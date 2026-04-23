'use client'

import { Search, Bell, Plus, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function TopBar() {
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] h-16 border-b border-white/5 bg-black/20 backdrop-blur-2xl flex items-center justify-between px-8">
      {/* Search Bar - Center Focused */}
      <div className="flex-1 max-w-2xl px-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search Project Intelligence..." 
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 py-2.5 text-sm text-white outline-none focus:bg-white/[0.06] focus:border-brand-500/20 transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/chat')}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Goal</span>
        </button>

        <div className="w-px h-6 bg-white/10 mx-2" />

        <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand-500 border-2 border-[#050508]" />
        </button>

        <button className="p-1 rounded-full border border-white/10 hover:border-brand-500/50 transition-all">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </button>
      </div>
    </header>
  )
}

'use client'

import { Search, Bell, Plus, User, Activity, Rocket, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { searchApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'

export default function TopBar() {
  const router = useRouter()
  const { userId, notifications, markNotificationsRead, clearNotifications, setActiveConversation } = useStore()
  const unreadCount = notifications.filter(n => !n.read).length
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 1 && userId) {
        setIsSearching(true)
        try {
          const res = await searchApi.global(query, userId)
          setResults(res.results)
          setShowResults(true)
        } catch (e) {
          console.error(e)
        } finally {
          setIsSearching(false)
        }
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query, userId])

  const handleResultClick = (result: any) => {
    if (result.type === 'project') {
      setActiveConversation(result.id)
    } else if (result.type === 'task') {
      setActiveConversation(result.conv_id)
    }
    router.push(result.route)
    setShowResults(false)
    setQuery('')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] h-16 border-b border-white/5 bg-black/20 backdrop-blur-2xl flex items-center justify-between px-8">
      {/* Search Bar - Center Focused */}
      <div className="flex-1 max-w-2xl px-4 relative" ref={searchRef}>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length > 1 && setShowResults(true)}
            placeholder="Search MeDo Intelligence (Projects, Tasks, Agents)..." 
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 py-2.5 text-sm text-white outline-none focus:bg-white/[0.06] focus:border-brand-500/20 transition-all"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-3 w-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <AnimatePresence>
          {showResults && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-4 right-4 mt-2 glass-strong rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-[100]"
            >
              <div className="p-2 divide-y divide-white/5">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleResultClick(r)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-all text-left group"
                  >
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand-500/10 transition-colors">
                      {r.type === 'project' ? <Rocket className="h-3.5 w-3.5 text-brand-400" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors">{r.title}</div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{r.type} • {r.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

        {/* Notification Center */}
        <div className="relative group/nav">
          <button 
            onClick={() => markNotificationsRead()}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand-500 border-2 border-[#050508] animate-pulse" />
            )}
          </button>

          {/* Dropdown Menu */}
          <div className="absolute top-full right-0 mt-4 w-80 opacity-0 translate-y-4 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-all duration-200 z-[70]">
            <div className="glass-strong rounded-[24px] border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Signals</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-[9px] text-slate-500 hover:text-brand-400 font-bold uppercase transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <Bell className="h-4 w-4 text-slate-600" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No active signals</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <div key={n.id} className={cn(
                        "p-4 hover:bg-white/[0.03] transition-colors cursor-default relative overflow-hidden group/item",
                        !n.read && "bg-brand-500/[0.02]"
                      )}>
                        {!n.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-500" />
                        )}
                        <div className="flex gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                            n.type === 'success' ? 'bg-green-500/10 text-green-400' :
                            n.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                            n.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-brand-500/10 text-brand-400'
                          )}>
                            <Activity className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-white leading-tight">{n.title}</div>
                            <div className="text-[10px] text-slate-400 leading-relaxed">{n.message}</div>
                            <div className="text-[8px] text-slate-600 font-black uppercase tracking-tighter pt-1">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-white/[0.01] border-t border-white/5 text-center">
                <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                  View System Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        <button className="p-1 rounded-full border border-white/10 hover:border-brand-500/50 transition-all">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </button>
      </div>
    </header>
  )
}


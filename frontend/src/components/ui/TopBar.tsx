'use client'

import { User, Bell, Zap, PlusCircle, Shield, Activity, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore, AgentRole } from '@/lib/store'
import { conversationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { auth } from '@/lib/firebase'

export default function TopBar() {
  const router = useRouter()
  const { userId, notifications, setActiveConversation, markNotificationsRead, clearNotifications } = useStore()
  const [showNotifs, setShowNotifs] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length
  const displayName = auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || 'Neural Core'

  const handleNewSession = async () => {
    if (!userId) return
    const loadingToast = toast.loading('Initializing neural session...')
    try {
      const newConv = await conversationsApi.create(userId, "New Analysis Session") as any
      setActiveConversation(newConv.id)
      toast.success('Session ready', { id: loadingToast })
      router.push('/chat')
    } catch (error) {
      console.error('Failed to create session:', error)
      toast.error('Failed to initialize session', { id: loadingToast })
    }
  }

  const getAgentIcon = (role?: AgentRole) => {
    switch (role) {
      case 'orchestrator': return <Zap className="h-4 w-4" />
      case 'product_manager': return <Shield className="h-4 w-4" />
      case 'developer': return <Activity className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-[150] transition-all duration-500 px-8 h-20 flex items-center justify-between bg-black/80 backdrop-blur-3xl border-b border-white/5 shadow-2xl"
    >
      {/* Left: Brand Section */}
      <div className="flex items-center h-full">
        <div 
          className="flex items-center gap-3 cursor-pointer group transition-all" 
          onClick={() => router.push('/dashboard')}
        >
          <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow-brand group-hover:scale-110 transition-transform">
             <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tighter uppercase italic group-hover:text-brand-400 transition-colors">
            Neural <span className="text-brand-500">AutoPilot</span>
          </span>
        </div>
      </div>

      {/* Right: Actions Section */}
      <div className="flex items-center gap-4">
        {/* New Project Button */}
        <button
          onClick={handleNewSession}
          className="flex items-center gap-2.5 h-10 px-5 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all active:scale-95 shadow-lg group"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Project</span>
        </button>

        <div className="h-6 w-px bg-white/10 mx-1" />

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifs(!showNotifs)
              if (!showNotifs) markNotificationsRead()
            }}
            className={cn(
              "p-2.5 rounded-xl transition-all relative group",
              showNotifs ? "bg-brand-500/20 text-brand-400 border border-brand-500/30" : "bg-white/[0.05] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand-500 border-2 border-surface-950 animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowNotifs(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 glass-card p-0 shadow-glow-premium border border-white/10 overflow-hidden z-[100]"
                  style={{ background: 'rgba(5, 5, 8, 0.95)', backdropFilter: 'blur(40px)', borderRadius: '24px' }}
                >
                  <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Activity Feed</h3>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-400 text-[9px] font-bold">
                          {unreadCount} NEW
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        clearNotifications()
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                      title="Clear All"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            className="p-5 flex gap-4 relative group hover:bg-white/[0.02] transition-colors cursor-default"
                          >
                            {!n.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 shadow-glow-brand" />
                            )}
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5",
                              n.type === 'error' ? "bg-red-500/10 text-red-400" : 
                              n.type === 'success' ? "bg-green-500/10 text-green-400" : 
                              "bg-brand-500/10 text-brand-400"
                            )}>
                              {getAgentIcon(n.agent_role)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-white truncate pr-2 uppercase tracking-tight">
                                  {n.title}
                                </span>
                                <span className="text-[9px] text-slate-600 font-bold whitespace-nowrap">
                                  {formatDistanceToNow(new Date(n.timestamp))}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 px-10 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5 opacity-20">
                          <Bell className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Silence is Golden</h4>
                        <p className="text-[10px] text-slate-500 font-medium">No active signals detected in the neural grid.</p>
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                      <button 
                        onClick={() => setShowNotifs(false)}
                        className="w-full py-2.5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white hover:bg-white/5 uppercase tracking-[0.2em] transition-all"
                      >
                        Dismiss Interface
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-white/10 mx-1" />

        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-all group"
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center border border-white/10 shadow-glow-brand">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors truncate max-w-[120px]">
            {displayName}
          </span>
        </button>
      </div>
    </motion.header>
  )
}

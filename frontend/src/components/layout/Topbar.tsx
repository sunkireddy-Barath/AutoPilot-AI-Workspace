import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Eye, EyeOff, Wifi, Zap, Shield } from 'lucide-react'
import { useAppStore } from '../../store'

import { WalletConnectButton } from '../ui/WalletConnectButton'

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { 
    user, balancesMasked, toggleBalanceMask, 
    searchQuery, setSearchQuery, 
    notifications, markNotificationsRead 
  } = useAppStore()
  const [searchFocused, setSearchFocused] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)

  const unreadCount = (notifications || []).filter(n => n && !n.read).length

  return (
    <header className="sticky top-0 z-[100] flex items-center justify-between px-6 py-4 border-b border-white/5"
      style={{ background: 'rgba(8, 8, 15, 0.8)', backdropFilter: 'blur(12px)' }}>
      {/* Left: Page title */}
      <div className="flex-shrink-0">
        <h1 className="text-lg font-bold text-white leading-tight">{title || 'StealthPay'}</h1>
        {subtitle && typeof subtitle === 'string' && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Center: Search */}
      <motion.div
        animate={{ width: searchFocused ? 320 : 240 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative hidden md:block mx-4"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="input-field pl-9 text-xs h-9 w-full bg-white/5 border-white/10"
        />
      </motion.div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Network indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">Devnet</span>
        </div>

        {/* Privacy toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleBalanceMask}
          className="p-2 rounded-xl transition-colors bg-white/5 border border-white/10"
          title={balancesMasked ? 'Show amounts' : 'Hide amounts'}
        >
          {balancesMasked ? (
            <EyeOff className="w-4 h-4 text-zinc-400" />
          ) : (
            <Eye className="w-4 h-4 text-violet-400" />
          )}
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowNotifs(!showNotifs)
              if (!showNotifs) markNotificationsRead()
            }}
            className="relative p-2 rounded-xl transition-colors bg-white/5 border border-white/10"
          >
            <Bell className="w-4 h-4 text-zinc-400" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <>
                {/* Backdrop to close when clicking outside */}
                <div 
                  className="fixed inset-0 z-[190] cursor-default" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowNotifs(false)
                  }}
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 glass-card p-0 shadow-[0_30px_100px_rgba(0,0,0,0.6)] border border-white/10 z-[200] overflow-hidden"
                  style={{ background: 'rgba(10, 10, 18, 0.98)', backdropFilter: 'blur(32px)', borderRadius: '24px' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Activity Feed</h3>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400 text-[9px] font-bold">
                          {unreadCount} NEW
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        markNotificationsRead()
                      }}
                      className="text-[9px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Content */}
                  <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {notifications.map(n => (
                          <motion.div 
                            key={n.id} 
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                            className="p-5 flex gap-4 relative group cursor-pointer transition-colors"
                          >
                            {!n.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 shadow-[2px_0_10px_rgba(124,58,237,0.3)]" />
                            )}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 
                              ${n.title.toLowerCase().includes('security') ? 'bg-emerald-500/10 text-emerald-400' : 
                                n.title.toLowerCase().includes('online') ? 'bg-blue-500/10 text-blue-400' : 
                                'bg-violet-500/10 text-violet-400'}`}
                            >
                              {n.title.toLowerCase().includes('security') ? <Shield className="w-5 h-5" /> : 
                               n.title.toLowerCase().includes('online') ? <Wifi className="w-5 h-5" /> : 
                               <Zap className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors truncate pr-2">
                                  {n.title}
                                </span>
                                <span className="text-[9px] text-zinc-600 font-bold whitespace-nowrap">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 px-10 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                          <Bell className="w-8 h-8 text-zinc-700" />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">All caught up!</h4>
                        <p className="text-xs text-zinc-500">No new notifications at the moment.</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                      <button className="w-full py-2.5 rounded-xl text-[10px] font-black text-zinc-500 hover:text-white hover:bg-white/5 uppercase tracking-[0.2em] transition-all">
                        Archive History
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Wallet Section */}
        <div className="relative z-[110]">
          <WalletConnectButton />
        </div>
      </div>
    </header>
  )
}

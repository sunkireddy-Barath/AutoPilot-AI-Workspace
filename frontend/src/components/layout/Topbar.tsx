import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Search, Eye, EyeOff, Wifi } from 'lucide-react'
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

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="sticky top-0 z-[100] flex items-center justify-between px-6 py-4 border-b border-white/5"
      style={{ background: 'rgba(8, 8, 15, 0.8)', backdropFilter: 'blur(12px)' }}>
      {/* Left: Page title */}
      <div className="flex-shrink-0">
        <h1 className="text-lg font-bold text-white leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
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
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 glass-card p-4 shadow-2xl border border-white/10 z-[200]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Activity Feed</h3>
                  <span className="text-[10px] text-zinc-500">{notifications.length} total</span>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {notifications.map(n => (
                    <div key={n.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-white">{n.title}</span>
                        <span className="text-[9px] text-zinc-600">{n.time}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
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

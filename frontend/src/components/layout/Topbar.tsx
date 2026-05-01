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
  const { user, balancesMasked, toggleBalanceMask } = useAppStore()
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className="flex items-center justify-between px-6 py-3 rounded-[20px] shadow-lg border border-white/10"
      style={{ background: 'rgba(15, 15, 25, 0.6)', backdropFilter: 'blur(20px)' }}>
      {/* Left: Page title */}
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Center: Search */}
      <motion.div
        animate={{ width: searchFocused ? 320 : 240 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative hidden md:block"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search transactions, employees..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="input-field pl-9 text-sm h-9 w-full"
        />
      </motion.div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Network indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">Mainnet</span>
        </div>

        {/* Privacy toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleBalanceMask}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          title={balancesMasked ? 'Show amounts' : 'Hide amounts'}
        >
          {balancesMasked ? (
            <EyeOff className="w-4 h-4 text-zinc-400" />
          ) : (
            <Eye className="w-4 h-4 text-violet-400" />
          )}
        </motion.button>

        {/* Notifications */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Bell className="w-4 h-4 text-zinc-400" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-500" />
        </motion.button>

        {/* Wallet */}
        <WalletConnectButton />
      </div>
    </header>
  )
}

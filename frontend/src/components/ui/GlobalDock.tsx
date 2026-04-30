'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Workflow, 
  BarChart3, 
  LogOut,
  Zap,
  Settings
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase, IS_DEMO_MODE } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
]

export default function GlobalDock() {
  const pathname = usePathname()
  const { 
    setUserId, 
    autonomousMode, 
    setAutonomousMode 
  } = useStore()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleLogout = async () => {
    if (IS_DEMO_MODE) {
      setUserId(null)
      window.location.href = '/auth'
      return
    }
    await supabase.auth.signOut()
  }

  const springConfig = { type: "spring", stiffness: 400, damping: 30 }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springConfig}
        className="flex items-center gap-1 px-2 py-2 rounded-[28px] glass-strong border border-white/10 shadow-glow-premium backdrop-blur-3xl"
      >
        {/* Launch / Home */}
        <div className="relative group px-1">
          <Link 
            href="/dashboard" 
            className={cn(
              "flex flex-col items-center p-2 rounded-2xl transition-all duration-200 active:scale-95",
              pathname === '/dashboard' ? "bg-brand-600/20" : "hover:bg-white/5"
            )}
          >
            <motion.div 
              whileHover={{ y: -2 }}
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                pathname === '/dashboard' ? "bg-brand-600 shadow-glow-brand" : "bg-surface-700 border border-white/10"
              )}
            >
              <Zap className={cn("h-5 w-5", pathname === '/dashboard' ? "text-white" : "text-brand-400")} />
            </motion.div>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-200 overflow-hidden",
              pathname === '/dashboard' ? "text-brand-400 max-h-4 opacity-100 mt-1.5" : "text-white max-h-0 opacity-0 group-hover:max-h-4 group-hover:opacity-100 group-hover:mt-1.5"
            )}>
              Launch
            </span>
          </Link>
        </div>

        <div className="w-px h-8 bg-white/5 mx-1 opacity-50" />

        {/* Main Nav */}
        <div className="flex items-center gap-1">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <motion.div 
                key={item.href}
                className="relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center px-4 py-2 rounded-2xl transition-all duration-200 group active:scale-95",
                    isActive 
                      ? "bg-white/5 text-brand-400" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, y: -2 }}
                    transition={springConfig}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 transition-colors duration-200",
                      isActive ? "text-brand-400" : "group-hover:text-white"
                    )} />
                  </motion.div>
                  
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-200 overflow-hidden whitespace-nowrap",
                    isActive ? "text-brand-400 max-h-4 opacity-100 mt-1.5" : "text-white max-h-0 opacity-0 group-hover:max-h-4 group-hover:opacity-100 group-hover:mt-1.5"
                  )}>
                    {item.name}
                  </span>

                  {/* Active Indicator Dot */}
                  {isActive && (
                    <motion.div
                      layoutId="dock-active-dot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500 shadow-glow-brand"
                      transition={springConfig}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="w-px h-8 bg-white/5 mx-1 opacity-50" />

        {/* Autonomous Mode Toggle */}
        <div 
          className="flex flex-col items-center px-4 active:scale-95 transition-transform"
          title={autonomousMode ? "AUTO ON — Full multi-agent orchestration running" : "AUTO OFF — Manual single-agent mode"}
        >
          <button 
            onClick={() => setAutonomousMode(!autonomousMode)}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 overflow-hidden shadow-inner",
              autonomousMode ? "bg-brand-600 shadow-glow-brand" : "bg-surface-700 border border-white/10"
            )}
          >
            {/* Pulse ring when active */}
            {autonomousMode && (
              <span className="absolute inset-0 rounded-full animate-ping bg-brand-500/30" />
            )}
            <motion.span 
              animate={{ x: autonomousMode ? 20 : 4 }}
              transition={springConfig}
              className={cn(
                "relative inline-block h-3 w-3 rounded-full shadow-lg transition-colors",
                autonomousMode ? "bg-white" : "bg-slate-500"
              )}
            />
          </button>
          <span className={cn(
            "text-[8px] font-black uppercase tracking-[0.2em] mt-1.5 transition-colors duration-200",
            autonomousMode ? "text-brand-400" : "text-slate-500"
          )}>
            {autonomousMode ? "Auto" : "Off"}
          </span>
        </div>

        <div className="w-px h-8 bg-white/5 mx-1 opacity-50" />

        {/* Settings & Logout */}
        <div className="flex items-center gap-1 px-1">
          <Link 
            href="/settings"
            className={cn(
              "flex flex-col items-center p-2 rounded-2xl transition-all group active:scale-95",
              pathname === '/settings' ? "bg-white/5 text-brand-400" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <motion.div whileHover={{ rotate: 90 }} transition={springConfig}>
              <Settings className={cn(
                "h-4 w-4 transition-colors",
                pathname === '/settings' ? "text-brand-400" : "group-hover:text-white"
              )} />
            </motion.div>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-200 overflow-hidden",
              pathname === '/settings' ? "text-brand-400 max-h-4 opacity-100 mt-1.5" : "text-white max-h-0 opacity-0 group-hover:max-h-4 group-hover:opacity-100 group-hover:mt-1.5"
            )}>Setup</span>
          </Link>

          <button 
            onClick={handleLogout}
            className="flex flex-col items-center p-2 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group active:scale-95"
          >
            <motion.div whileHover={{ x: 2 }} transition={springConfig}>
              <LogOut className="h-4 w-4" />
            </motion.div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400 transition-all duration-300 overflow-hidden max-h-0 opacity-0 group-hover:max-h-4 group-hover:opacity-100 group-hover:mt-1.5">Exit</span>
          </button>
        </div>
      </motion.nav>
    </div>
  )
}

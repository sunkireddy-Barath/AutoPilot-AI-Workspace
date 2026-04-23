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
              "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300",
              pathname === '/dashboard' ? "bg-brand-600/20 shadow-glow-brand/20" : "hover:bg-white/5"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all duration-300",
              pathname === '/dashboard' ? "bg-brand-600 shadow-glow-brand" : "bg-surface-700 border border-white/10"
            )}>
              <Zap className={cn("h-5 w-5", pathname === '/dashboard' ? "text-white" : "text-brand-400")} />
            </div>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300",
              pathname === '/dashboard' ? "text-brand-400" : "text-slate-500 group-hover:text-white"
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
                whileHover={{ y: -4 }}
                transition={springConfig}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 group",
                    isActive 
                      ? "bg-white/5 text-brand-400" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-transform duration-500",
                    isActive ? "scale-110 animate-pulse-soft" : "group-hover:scale-110"
                  )} />
                  
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                    isActive ? "text-brand-400 opacity-100" : "text-slate-500 opacity-70 group-hover:opacity-100"
                  )}>
                    {item.name}
                  </span>

                  {/* Active Indicator Dot */}
                  {isActive && (
                    <motion.div
                      layoutId="dock-active-dot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500 shadow-glow-brand"
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="w-px h-8 bg-white/5 mx-1 opacity-50" />

        {/* Autonomous Mode Toggle */}
        <div className="flex flex-col items-center gap-1 px-3">
          <button 
            onClick={() => setAutonomousMode(!autonomousMode)}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-500 group overflow-hidden shadow-inner",
              autonomousMode ? "bg-brand-600 shadow-glow-brand" : "bg-surface-800 border border-white/5"
            )}
          >
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]",
              !autonomousMode && "hidden"
            )} />
            <span className={cn(
              "inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 shadow-lg",
              autonomousMode ? "translate-x-5" : "translate-x-1"
            )} />
          </button>
          <span className={cn(
            "text-[8px] font-black uppercase tracking-[0.2em] transition-colors",
            autonomousMode ? "text-brand-400" : "text-slate-500"
          )}>Autonomous</span>
        </div>

        <div className="w-px h-8 bg-white/5 mx-1 opacity-50" />

        {/* Settings & Logout */}
        <div className="flex items-center gap-1 px-1">
          <Link 
            href="/settings"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all group active:scale-90",
              pathname === '/settings' ? "bg-white/5 text-brand-400" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className={cn(
              "h-4 w-4 transition-transform duration-500",
              pathname === '/settings' ? "rotate-45" : "group-hover:rotate-45"
            )} />
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] transition-colors",
              pathname === '/settings' ? "text-brand-400" : "text-slate-500 group-hover:text-white"
            )}>Setup</span>
            
            {/* Setting Info Tooltip */}
            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl bg-[#0a0a14] border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none min-w-[140px] z-[100]">
               <div className="text-[9px] font-black text-brand-400 uppercase tracking-widest mb-1">System Config</div>
               <div className="text-[8px] text-slate-500 leading-tight">Neural ID: pilot@autopilot.ai<br/>Security: V4 Matrix Active</div>
               <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white/10" />
            </div>
          </Link>

          <button 
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group active:scale-90"
          >
            <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-red-400 transition-colors">Exit</span>
          </button>
        </div>
      </motion.nav>
    </div>
  )
}

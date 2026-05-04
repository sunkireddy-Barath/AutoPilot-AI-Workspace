'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Workflow, 
  BarChart3, 
  Settings, 
  LogOut,
  Zap
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase, IS_DEMO_MODE } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Command Center', href: '/chat', icon: MessageSquare },
  { name: 'AI Agents', href: '/agents', icon: Users },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Business Insights', href: '/insights', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { 
    sidebarOpen, 
    setSidebarOpen,
    setUserId, 
    autonomousMode, 
    setAutonomousMode 
  } = useStore()

  const handleLogout = async () => {
    if (IS_DEMO_MODE) {
      setUserId(null)
      window.location.href = '/auth'
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center glass-morphic shadow-glow-premium transition-all duration-500 rounded-full h-20 px-2",
        sidebarOpen ? "max-w-[95vw]" : "w-auto"
      )}
    >
      <div className="flex items-center px-4 border-r border-white/5 h-full mr-2">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 shadow-glow-brand animate-shimmer-zap">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              className="text-sm font-black text-white tracking-widest uppercase overflow-hidden whitespace-nowrap"
            >
              AutoPilot
            </motion.span>
          )}
        </Link>
      </div>

      <nav className="flex items-center gap-1.5 h-full px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-300 relative",
                  isActive 
                    ? "bg-brand-600/20 text-brand-300 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] border border-brand-500/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-all duration-300",
                  isActive ? "text-brand-400 scale-110" : "text-slate-400 group-hover:text-white group-hover:scale-110"
                )} />
                {sidebarOpen && <span className="ml-3 truncate tracking-tight whitespace-nowrap">{item.name}</span>}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-brand-500 shadow-glow-brand"
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <div className="flex items-center gap-6 px-4 border-l border-white/5 h-full ml-2">
        {/* Neural Sync Status */}
        {sidebarOpen && (
          <div className="hidden lg:flex flex-col gap-1 w-24">
             <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                Sync
              </span>
              <span className="text-green-500">Stable</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ 
                  width: ['20%', '80%', '50%', '95%', '70%'],
                  backgroundColor: ['#6366f133', '#6366f166', '#6366f133']
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="h-full" 
              />
            </div>
          </div>
        )}

        {/* Autonomous Mode Toggle */}
        <div className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2 bg-surface-900/40 border border-white/5",
        )}>
          {sidebarOpen && (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-brand-400">Autonomous</span>
              <span className="text-[10px] text-slate-300 font-bold whitespace-nowrap">Neural Engine</span>
            </div>
          )}
          <button 
            onClick={() => setAutonomousMode(!autonomousMode)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500",
              autonomousMode ? "bg-brand-600 shadow-glow-brand" : "bg-white/10"
            )}
          >
            <span className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-500 shadow-lg",
              autonomousMode ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </div>

        {sidebarOpen ? (
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        ) : (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center p-2 text-slate-500 hover:text-brand-400 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

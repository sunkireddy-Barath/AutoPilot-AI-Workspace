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
    <motion.aside
      className={cn(
        "flex flex-col border-r border-white/5 bg-surface-800 transition-all duration-300",
        sidebarOpen ? "w-64" : "w-20"
      )}
      initial={false}
    >
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-glow-brand">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold text-white tracking-widest uppercase">AutoPilot</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-brand-600/10 text-brand-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors",
                isActive ? "text-brand-400" : "text-slate-400 group-hover:text-white"
              )} />
              {sidebarOpen && <span className="ml-3 truncate">{item.name}</span>}
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500 shadow-glow-brand"
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/5 p-4 space-y-4">
        {/* Autonomous Mode Toggle */}
        <div className={cn(
          "flex items-center rounded-xl px-3 py-2.5 bg-surface-900/50 border border-white/5",
          sidebarOpen ? "justify-between" : "justify-center"
        )}>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-tighter text-brand-400">Autonomous</span>
              <span className="text-xs text-slate-300 font-medium">Mode</span>
            </div>
          )}
          <button 
            onClick={() => setAutonomousMode(!autonomousMode)}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200",
              autonomousMode ? "bg-brand-600 shadow-glow-brand" : "bg-surface-800"
            )}
          >
            <span className={cn(
              "inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200",
              autonomousMode ? "translate-x-5" : "translate-x-1"
            )} />
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 transition-colors group-hover:text-red-400" />
          {sidebarOpen && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </motion.aside>
  )
}

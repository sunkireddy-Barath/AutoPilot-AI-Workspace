'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Workflow, 
  BarChart3, 
  Settings, 
  LogOut,
  Zap,
  User
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { localAuth, getSession } from '@/lib/localAuth'
import { auth } from '@/lib/firebase'
import { signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

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

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('Neural Operator')

  useEffect(() => {
    if (auth) {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid)
          setUserEmail(user.email ?? null)
          setUserName(user.displayName || (user.email?.split('@')[0] ?? 'Neural Operator'))
        }
      })
      return unsub
    } else {
      const session = getSession()
      if (session) {
        setUserId(session.id)
        setUserEmail(session.email)
        setUserName(session.name || session.email.split('@')[0])
      }
    }
  }, [setUserId])

  const handleLogout = async () => {
    const logoutToast = toast.loading('Terminating neural session...')
    if (auth) {
      await firebaseSignOut(auth)
    } else {
      localAuth.signOut()
    }
    setUserId(null)
    toast.success('Session terminated', { id: logoutToast })
    window.location.href = '/auth'
  }

  return (
    /* 
       ROOT WRAPPER: Guaranteed center using left/right 0 and justify-center.
       This is more robust than translate-x-1/2 when dealing with complex internal flex/grid logic.
    */
    <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 120 }}
        className={cn(
          "pointer-events-auto glass-morphic shadow-glow-premium rounded-[32px] h-20 border border-white/10 flex items-center transition-all duration-500",
          "w-fit px-4"
        )}
      >
        <div className="flex items-center h-full gap-4">
          
          {/* Brand - Vertical Stack */}
          <Link href="/dashboard" className="flex flex-col items-center gap-1.5 group shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 shadow-glow-brand group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5 text-white fill-white/20" />
            </div>
            <span className="text-[8px] font-black text-white/40 tracking-widest uppercase group-hover:text-brand-400 transition-colors">
              AutoPilot
            </span>
          </Link>

          <div className="w-px h-10 bg-white/10" />

          {/* Vertical Stack Navigation */}
          <nav className="flex items-center gap-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex flex-col items-center justify-center min-w-[64px] h-16 transition-all duration-500 relative rounded-2xl gap-1.5",
                      isActive 
                        ? "bg-brand-500/10 text-brand-300 border border-brand-500/20 shadow-glow-brand/5" 
                        : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-brand-400" : "text-slate-400 group-hover:text-white"
                    )} />
                    
                    <span className={cn(
                      "text-[9px] font-bold tracking-tight text-center leading-none px-1",
                      isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                    )}>
                      {item.name.replace('AI ', '')}
                    </span>

                    {isActive && (
                      <motion.div
                        layoutId="active-dot"
                        className="absolute -bottom-1 h-1 w-4 rounded-full bg-brand-500 shadow-glow-brand"
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          <div className="w-px h-10 bg-white/10" />

          {/* Status & Actions Icons */}
          <div className="flex items-center gap-2 px-1 shrink-0">
            {/* Minimal Sync Indicator */}
            <div className="flex flex-col items-center gap-2 group/sync">
              <div className="p-2 rounded-full hover:bg-white/5 transition-all relative">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              </div>
              <span className="text-[8px] font-bold text-slate-500">SYNC</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button 
                onClick={() => setAutonomousMode(!autonomousMode)}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-500",
                  autonomousMode ? "bg-brand-600/80" : "bg-white/10"
                )}
              >
                <span className={cn(
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all duration-500",
                  autonomousMode ? "translate-x-5" : "translate-x-0.5"
                )} />
              </button>
              <span className="text-[8px] font-bold text-slate-500">AUTO</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-2 h-16 w-10 text-slate-500 hover:text-red-400 transition-all group"
              title="Logout"
            >
              <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-all">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="text-[8px] font-bold text-slate-500 group-hover:text-red-400">EXIT</span>
            </button>
          </div>

          <div className="w-px h-10 bg-white/10" />

          {/* User Profile Section */}
          <div className="flex items-center gap-3 pl-2 group/profile cursor-pointer shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-white uppercase tracking-wider group-hover:text-brand-400 transition-colors whitespace-nowrap">
                {userName}
              </span>
              <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">
                Level 4 Access
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10 flex items-center justify-center shadow-glow-indigo transition-transform group-hover:scale-110">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Link2,
  Wallet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  Settings,
} from 'lucide-react'
import { useAppStore } from '../../store'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'payroll', label: 'Payroll', icon: Users, path: '/payroll' },
  { id: 'invoices', label: 'Invoices', icon: FileText, path: '/invoices' },
  { id: 'payments', label: 'Payment Links', icon: Link2, path: '/payments' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/wallet' },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, path: '/compliance' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, user, logout } = useAppStore()
  const location = useLocation()

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col"
      style={{
        background: 'rgba(8, 8, 15, 0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}>
          <Zap className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="font-bold text-sm text-white">StealthPay</div>
              <div className="text-[10px] text-violet-400 font-medium">Private Finance OS</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink key={item.id} to={item.path}>
              <motion.div
                whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                className={cn(
                  'sidebar-item group',
                  isActive && 'active',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 flex-shrink-0 sidebar-icon transition-colors',
                  isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
                )} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-0 w-0.5 h-6 rounded-l-full bg-violet-400"
                  />
                )}
              </motion.div>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-4 border-t border-white/5 space-y-1">
        {/* User info */}
        <AnimatePresence>
          {!sidebarCollapsed && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 py-2.5 mb-2 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
            >
              <div className="text-xs font-semibold text-white truncate">{user.companyName}</div>
              <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => {}}
          className={cn('sidebar-item w-full', sidebarCollapsed && 'justify-center px-0')}
        >
          <Settings className="w-5 h-5 text-zinc-500 flex-shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={logout}
          className={cn('sidebar-item w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10', sidebarCollapsed && 'justify-center px-0')}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn('sidebar-item w-full mt-2', sidebarCollapsed && 'justify-center px-0')}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-zinc-500" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}

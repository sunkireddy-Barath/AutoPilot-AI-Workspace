import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastContainer } from '../ui/ToastContainer'
import { useAppStore } from '../../store'

interface AppLayoutProps {
  children: React.ReactNode
  pageTitle: string
  pageSubtitle?: string
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export function AppLayout({ children, pageTitle, pageSubtitle }: AppLayoutProps) {
  const { sidebarCollapsed, user, setUser } = useAppStore()
  const { publicKey, connected } = useWallet()

  useEffect(() => {
    if (connected && publicKey && user && user.walletAddress !== publicKey.toBase58()) {
      setUser({ ...user, walletAddress: publicKey.toBase58() })
    }
  }, [connected, publicKey, user, setUser])

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col p-6">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[300px] opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 grid-pattern opacity-10" />
      </div>

      <Sidebar />

      {/* Main content area */}
      <motion.main
        animate={{ 
          paddingLeft: sidebarCollapsed ? 88 : 256,
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 flex flex-col min-h-screen relative z-10"
      >
        <Topbar title={pageTitle} subtitle={pageSubtitle} />

        <motion.div
          key={pageTitle}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex-1 mt-6"
        >
          {children}
        </motion.div>
      </motion.main>

      <ToastContainer />
    </div>
  )
}

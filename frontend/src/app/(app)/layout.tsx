'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase, IS_DEMO_MODE } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import GlobalDock from '@/components/ui/GlobalDock'
import MeshBackground from '@/components/ui/MeshBackground'
import LoadingSplash from '@/components/ui/LoadingSplash'
import { Toaster } from 'react-hot-toast'
import CursorSpotlight from '@/components/ui/CursorSpotlight'

import TopBar from '@/components/ui/TopBar'
import GlobalOrchestrator from '@/components/ui/GlobalOrchestrator'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { userId, setUserId } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (IS_DEMO_MODE) {
        if (!userId) {
          router.replace('/auth')
        }
        // Removed artificial delay for snappy performance
        setLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/auth')
      } else {
        setUserId(data.session.user.id)
      }
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null)
        router.replace('/auth')
      } else if (session) {
        setUserId(session.user.id)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [router, setUserId, userId])

  if (loading) return <LoadingSplash />

  return (
    <div className="flex h-screen overflow-hidden bg-[#050508] relative">
      <MeshBackground />
      <GlobalOrchestrator />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <GlobalDock />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a27',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  )
}

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
        // Artificial delay for premium feel
        setTimeout(() => setLoading(false), 1200)
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
      
      <main className="flex-1 overflow-auto relative pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
            transition={{ 
              duration: 0.5, 
              ease: [0.22, 1, 0.36, 1],
              opacity: { duration: 0.4 }
            }}
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

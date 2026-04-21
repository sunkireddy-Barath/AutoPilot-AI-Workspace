'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, IS_DEMO_MODE } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import Sidebar from '@/components/ui/Sidebar'
import { Toaster } from 'react-hot-toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { userId, setUserId } = useStore()

  useEffect(() => {
    if (IS_DEMO_MODE) {
      // In Demo Mode, if we have a userId in the store, we're good.
      // If not, redirect to auth page.
      if (!userId) {
        router.replace('/auth')
      }
      return
    }

    // Check auth on mount
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/auth')
      } else {
        setUserId(data.session.user.id)
      }
    })

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

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-surface-900">
        {children}
      </main>
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

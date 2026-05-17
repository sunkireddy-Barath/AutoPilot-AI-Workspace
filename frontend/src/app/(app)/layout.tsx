'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Sidebar from '@/components/ui/Sidebar'
import GlobalOrchestrator from '@/components/ui/GlobalOrchestrator'
import MeshBackground from '@/components/ui/MeshBackground'
import { Toaster } from 'react-hot-toast'
import { getSession } from '@/lib/localAuth'
import { useStore } from '@/lib/store'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { userId, setUserId } = useStore()

  useEffect(() => {
    if (auth) {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid)
        } else {
          router.replace('/auth')
        }
      })
      return unsub
    } else {
      // Local auth fallback
      const session = getSession()
      if (!session && !userId) {
        router.replace('/auth')
      }
    }
  }, [userId, router, setUserId])

  return (
    <div className="relative min-h-screen bg-surface-950 overflow-hidden">
      {/* Neural Background */}
      <MeshBackground />

      {/* Global Orchestrator (WebSocket Logic) */}
      <GlobalOrchestrator />

      <main className="fixed top-0 left-0 right-0 bottom-0 z-10 overflow-hidden">
        <div className="h-full flex flex-col">
          {children}
        </div>
      </main>

      {/* Global Floating Dock */}
      <Sidebar />

      {/* Toaster with Custom Styling */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(10, 10, 15, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
          }
        }}
      />
    </div>
  )
}

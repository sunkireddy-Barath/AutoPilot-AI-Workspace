'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useStore } from '@/lib/store'
import { Toaster } from 'react-hot-toast'

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const setUserId = useStore((s) => s.setUserId)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        setUserId(null)
      }
    })

    return () => unsubscribe()
  }, [setUserId])

  return (
    <>
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '12px',
          },
          duration: 4000,
        }}
      />
    </>
  )
}

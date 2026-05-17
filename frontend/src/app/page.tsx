'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getSession } from '@/lib/localAuth'
import LandingPage from '@/components/landing/LandingPage'
import { motion } from 'framer-motion'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    if (auth) {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          setHasSession(true)
          router.replace('/dashboard')
        } else {
          setLoading(false)
        }
      })
      return unsub
    } else {
      const session = getSession()
      if (session) {
        setHasSession(true)
        router.replace('/dashboard')
      } else {
        setLoading(false)
      }
    }
  }, [router])

  if (loading || hasSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050508]">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-2 w-2 rounded-full bg-brand-500 shadow-glow-brand" />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Neural Link Initiating...</p>
        </motion.div>
      </div>
    )
  }

  return <LandingPage />
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LandingPage from '@/components/landing/LandingPage'
import { motion } from 'framer-motion'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
  }, [])

  if (loading) {
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

'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { conversationsApi } from '@/lib/api'
import ChatWindow from '@/components/chat/ChatWindow'
import { motion } from 'framer-motion'

export default function ChatPage() {
  const { userId, setActiveConversation, activeConversationId, setMessages } = useStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    if (!userId) {
      setInitializing(false)
      return
    }

    const initChat = async () => {
      try {
        const data = await conversationsApi.list(userId) as any[]
        
        if (data.length > 0) {
          const latest = data[0]
          setActiveConversation(latest.id)
          const msgs = await conversationsApi.getMessages(latest.id)
          setMessages(msgs as any[])
        } else {
          const newConv = await conversationsApi.create(userId, "New Project Analysis") as any
          setActiveConversation(newConv.id)
          setMessages([])
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error)
        // Set a dummy ID or handle error UI if needed
      } finally {
        setInitializing(false)
      }
    }

    initChat()
  }, [userId, setActiveConversation, setMessages])

  if (initializing) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-surface-900 px-4">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mb-4"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-500 shadow-glow-brand" />
        </motion.div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Initializing Neural Engine...</p>
      </div>
    )
  }

  return (
    <div className="h-full">
      <ChatWindow />
    </div>
  )
}

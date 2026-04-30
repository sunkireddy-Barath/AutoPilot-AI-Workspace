'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { conversationsApi } from '@/lib/api'
import ChatWindow from '@/components/chat/ChatWindow'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
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
        if (activeConversationId) {
          // If navigated from dashboard project history
          const msgs = await conversationsApi.getMessages(activeConversationId)
          setMessages(msgs as any[])
        } else {
          // Initial load without a selected conversation
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
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error)
      } finally {
        setInitializing(false)
      }
    }

    initChat()
  }, [userId, activeConversationId]) // Re-run if user selects a different conversation from dashboard

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
    <div className="w-full h-full max-w-full flex flex-col bg-[#050508] pt-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="flex-1 min-h-0 relative overflow-hidden"
      >
        <ChatWindow />
      </motion.div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Clock, Loader2, Zap } from 'lucide-react'
import { useStore, Conversation } from '@/lib/store'
import { conversationsApi } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface ConversationHistoryProps {
  open: boolean
  onClose: () => void
}

export default function ConversationHistory({ open, onClose }: ConversationHistoryProps) {
  const { userId, conversations, setConversations, setActiveConversation, setMessages, activeConversationId } = useStore()
  const [loadingConvId, setLoadingConvId] = useState<string | null>(null)
  const [fetchingList, setFetchingList] = useState(false)
  const router = useRouter()

  // Load conversations list whenever panel opens
  useEffect(() => {
    if (!open || !userId) return
    const fetch = async () => {
      setFetchingList(true)
      try {
        const list = await conversationsApi.list(userId) as Conversation[]
        setConversations(list)
      } catch {
        toast.error('Failed to load history')
      } finally {
        setFetchingList(false)
      }
    }
    fetch()
  }, [open, userId, setConversations])

  const handleSelectConversation = async (conv: Conversation) => {
    setLoadingConvId(conv.id)
    try {
      const msgs = await conversationsApi.getMessages(conv.id) as any[]
      setActiveConversation(conv.id)
      setMessages(msgs)
      onClose()
      // Always redirect to /chat so the history is visible
      router.push('/chat')
    } catch {
      toast.error('Failed to load conversation')
    } finally {
      setLoadingConvId(null)
    }
  }

  const safeDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return 'recently'
      return `${formatDistanceToNow(d)} ago`
    } catch {
      return 'recently'
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-80 bg-[#0a0a12] border-r border-white/8 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-brand-500/10">
                  <Zap className="h-4 w-4 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Project History</h3>
                  <p className="text-[10px] text-slate-500 font-medium">{conversations.length} sessions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
              {fetchingList ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 text-brand-400 animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <MessageSquare className="h-10 w-10 text-slate-700 mb-3" />
                  <p className="text-sm font-bold text-slate-500">No sessions yet</p>
                  <p className="text-xs text-slate-600 mt-1">Start a new project to get going.</p>
                </div>
              ) : (
                <div className="space-y-0.5 px-2">
                  {conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId
                    const isLoading = loadingConvId === conv.id
                    return (
                      <motion.button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 group',
                          isActive
                            ? 'bg-brand-500/15 border border-brand-500/25'
                            : 'hover:bg-white/[0.04] border border-transparent'
                        )}
                      >
                        {/* Icon */}
                        <div className={cn(
                          'flex-shrink-0 mt-0.5 p-1.5 rounded-lg transition-colors',
                          isActive ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'
                        )}>
                          {isLoading
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <MessageSquare className="h-3.5 w-3.5" />
                          }
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-xs font-bold truncate',
                            isActive ? 'text-brand-300' : 'text-slate-200 group-hover:text-white'
                          )}>
                            {conv.title}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5 text-slate-600" />
                            <span className="text-[10px] text-slate-500 font-medium">
                              {safeDate(conv.updated_at || conv.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Active Badge */}
                        {isActive && (
                          <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-white/5 flex-shrink-0">
              <p className="text-[10px] text-slate-600 font-medium text-center">
                Click a session to restore the full conversation
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

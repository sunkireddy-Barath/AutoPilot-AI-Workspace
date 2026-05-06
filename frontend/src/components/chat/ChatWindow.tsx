'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusCircle,
  Settings2,
  History,
  Bot,
  Cpu,
  Zap,
  RefreshCw,
  Rocket,
  Search,
  Share2,
  Download
} from 'lucide-react'
import { useStore, Message, AgentRole } from '@/lib/store'
import { wsClient, WSEvent } from '@/lib/websocket'
import { chatApi, conversationsApi } from '@/lib/api'
import { exportProjectToMarkdown } from '@/lib/export'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import ThinkingIndicator from './ThinkingIndicator'
import ConversationHistory from './ConversationHistory'
import toast from 'react-hot-toast'

export default function ChatWindow() {
  const {
    userId,
    activeConversationId,
    messages,
    setMessages,
    addMessage,
    setActiveConversation,
    streamingContent,
    appendStreamChunk,
    clearStream,
    setAgentStatus,
    agentStatuses,
    addTask,
    updateTask,
    addAgentActivity,
    setWorkflowGraph,
    setAgentsRunning,
    tasks
  } = useStore()

  const [loading, setLoading] = useState(false)
  const [activeAgent, setActiveAgent] = useState<AgentRole | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleExport = () => {
    if (messages.length === 0) return
    const firstMsg = messages.find(m => m.role === 'user')?.content || 'AutoPilot Project'
    const projectName = firstMsg.slice(0, 30) + (firstMsg.length > 30 ? '...' : '')
    exportProjectToMarkdown(projectName, messages, tasks)
    toast.success('Project plan downloaded')
  }

  // Auto-initialize session if none exists
  useEffect(() => {
    if (userId && !activeConversationId && !loading) {
      handleNewSession()
    }
  }, [userId, activeConversationId])

  // Scroll to bottom on new messages or streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent, activeAgent])

  // Setup WebSocket connection
  useEffect(() => {
    if (!activeConversationId) return

    wsClient.connect(activeConversationId)

    // Handle agent thinking events
    wsClient.connect(activeConversationId)

    return () => {
      // Handlers are managed by GlobalOrchestrator
    }
  }, [activeConversationId])

  const handleSendMessage = async (text: string) => {
    if (!userId) return

    let currentConvId = activeConversationId

    // Auto-create session if none exists
    if (!currentConvId) {
      setLoading(true)
      try {
        const newConv = await conversationsApi.create(userId, "Autonomous Project Session") as any
        currentConvId = newConv.id
        setActiveConversation(currentConvId!)
      } catch (error) {
        toast.error('Failed to initialize session')
        setLoading(false)
        return
      }
    }

    // Add user message locally for immediate feedback
    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: currentConvId!,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    }
    addMessage(userMsg)
    setAgentsRunning(true)

    setLoading(true)
    try {
      const result = await chatApi.sendMessage({
        conversation_id: currentConvId!,
        user_id: userId,
        message: text,
        autonomous_mode: useStore.getState().autonomousMode
      }) as any

      // Add the final assistant message from the REST response
      if (result?.message) {
        addMessage({
          id: result.message.id,
          conversation_id: currentConvId!,
          role: 'agent',
          agent_role: 'orchestrator',
          content: result.message.content,
          created_at: result.message.created_at || new Date().toISOString()
        })
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewSession = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const newConv = await conversationsApi.create(userId, "New Analysis Session") as any
      setActiveConversation(newConv.id)
      setMessages([])
      toast.success('Started new session')
    } catch (error) {
      toast.error('Failed to create new session')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ConversationHistory open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <div className="flex flex-col h-full bg-transparent overflow-hidden relative w-full">

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar flex flex-col pt-4 relative"
      >

        <div className="max-w-3xl w-full mx-auto px-6 flex-1 flex flex-col pb-20 justify-center">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center text-center px-4 py-20">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-3xl bg-brand-600/10 flex items-center justify-center mb-8 border border-brand-500/20 shadow-glow-brand/20 relative"
              >
                <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full" />
                <Zap className="h-10 w-10 text-brand-400 fill-brand-400/20 relative z-10" />
              </motion.div>

              <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">
                Neural <span className="text-brand-500">AutoPilot</span>
              </h1>
              <p className="text-slate-500 max-w-sm text-base font-medium leading-relaxed mb-12">
                The next generation of autonomous project execution. Describe your goal to begin.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  { title: "Product Manager", desc: "Define goals, user stories & roadmaps", icon: Rocket, msg: "Act as the Product Manager and help me define a roadmap for a new app." },
                  { title: "Lead Developer", desc: "Generate architecture and write code", icon: Cpu, msg: "Act as the Lead Developer and help me design the system architecture." },
                  { title: "Marketing Expert", desc: "Draft campaigns and growth strategies", icon: Share2, msg: "Act as the Marketing Expert and create a growth campaign for my product." },
                  { title: "Data Analyst", desc: "Extract insights and define KPIs", icon: Search, msg: "Act as the Data Analyst and define key metrics for my business." }
                ].map((item) => (
                  <button
                    key={item.title}
                    onClick={() => handleSendMessage(item.msg)}
                    className="flex flex-col items-start p-5 rounded-[20px] bg-white/[0.03] border border-white/5 hover:border-brand-500/30 hover:bg-white/[0.05] transition-all duration-300 group text-left relative overflow-hidden h-28"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300">
                      <item.icon size={48} />
                    </div>
                    <div className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1 transition-transform duration-300 group-hover:-translate-y-1">Agent</div>
                    <div className="text-sm font-bold text-white mb-1 transition-transform duration-300 group-hover:-translate-y-1">{item.title}</div>

                    {/* Words displayed in bottom side on mouse over */}
                    <div className="absolute bottom-5 left-5 right-5 text-xs text-slate-500 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {streamingContent && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  conversation_id: activeConversationId!,
                  role: 'agent',
                  agent_role: activeAgent || 'orchestrator',
                  content: streamingContent,
                  created_at: new Date().toISOString()
                }}
              />
            )}

            {activeAgent && !streamingContent && (
              <ThinkingIndicator role={activeAgent} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Area - Relative at bottom of flex-col */}
      <div className="w-full pb-32 pt-4 px-4 bg-gradient-to-t from-[#050508] via-[#050508]/95 to-transparent">
        <ChatInput
          onSend={handleSendMessage}
          loading={loading}
          disabled={!userId}
        />
      </div>
    </div>
    </>
  )
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  )
}

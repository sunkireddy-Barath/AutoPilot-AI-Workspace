'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Rocket, Cpu, Share2, Search, History, Download, PlusCircle, Sparkles } from 'lucide-react'
import { useStore, Message } from '@/lib/store'
import { wsClient } from '@/lib/websocket'
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
    conversations,
    messages,
    setMessages,
    addMessage,
    addConversation,
    setActiveConversation,
    streamingContent,
    setAgentsRunning,
    autonomousMode,
    tasks,
    setWorkflowGraph,
  } = useStore()

  const [loading, setLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [thinkingAgent, setThinkingAgent] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Show agent thinking indicators while waiting for REST response.
  // AUTO OFF → only PM indicator. AUTO ON → cycles through all 5 agents.
  useEffect(() => {
    if (!loading) { setThinkingAgent(null); return }
    if (!autonomousMode) {
      setThinkingAgent('product_manager')
      return
    }
    const agents = ['product_manager', 'developer', 'marketing', 'analyst', 'operations'] as const
    let idx = 0
    setThinkingAgent(agents[0])
    const interval = setInterval(() => {
      idx = (idx + 1) % agents.length
      setThinkingAgent(agents[idx])
    }, 2000)
    return () => clearInterval(interval)
  }, [loading, autonomousMode])

  // Active session title from conversation list
  const activeSession = conversations.find(c => c.id === activeConversationId)

  // Scroll to bottom whenever messages / streaming content change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent, thinkingAgent])

  // Ensure WS is connected whenever the active conversation changes
  useEffect(() => {
    if (!activeConversationId) return
    wsClient.connect(activeConversationId)
  }, [activeConversationId])

  const handleSendMessage = useCallback(async (text: string) => {
    if (!userId) return

    let currentConvId = activeConversationId

    // Auto-create a conversation if none exists yet
    if (!currentConvId) {
      setLoading(true)
      try {
        const newConv = await conversationsApi.create(userId, text.slice(0, 60)) as any
        currentConvId = newConv.id
        setActiveConversation(currentConvId!)
        addConversation(newConv)  // add to history immediately
      } catch {
        toast.error('Failed to initialize session')
        setLoading(false)
        return
      }
    }

    // Optimistically add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: currentConvId!,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    addMessage(userMsg)
    setAgentsRunning(true)
    setLoading(true)

    try {
      const result = await chatApi.sendMessage({
        conversation_id: currentConvId!,
        user_id: userId,
        message: text,
        autonomous_mode: useStore.getState().autonomousMode,
      }) as any

      // Push workflow graph into store so WorkflowGraph animates immediately
      if (result?.workflow_nodes?.length) {
        setWorkflowGraph(result.workflow_nodes, result.workflow_edges ?? [])
      }

      // Display each agent message sequentially with a short delay for a streaming feel
      const agentMsgs: any[] = result?.messages ?? []
      if (agentMsgs.length > 0) {
        for (const msg of agentMsgs) {
          await new Promise<void>(res => setTimeout(res, 700))
          addMessage({
            id: msg.id || crypto.randomUUID(),
            conversation_id: currentConvId!,
            role: 'agent',
            agent_role: msg.agent_role || 'orchestrator',
            content: msg.content || '',
            metadata: msg.metadata || {},
            created_at: msg.created_at || new Date().toISOString(),
          })
        }
      } else if (result?.message) {
        // Fallback: single orchestrator message
        addMessage({
          id: result.message.id,
          conversation_id: currentConvId!,
          role: 'agent',
          agent_role: result.message.agent_role || 'orchestrator',
          content: result.message.content,
          metadata: result.message.metadata || {},
          created_at: result.message.created_at || new Date().toISOString(),
        })
      }

      setAgentsRunning(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
      setAgentsRunning(false)
    } finally {
      setLoading(false)
    }
  }, [userId, activeConversationId, addMessage, addConversation, setActiveConversation, setAgentsRunning, setWorkflowGraph])

  const handleNewSession = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const newConv = await conversationsApi.create(userId, 'New Analysis Session') as any
      setActiveConversation(newConv.id)
      addConversation(newConv)  // add to history immediately
      setMessages([])
      toast.success('New session started')
    } catch {
      toast.error('Failed to create session')
    } finally {
      setLoading(false)
    }
  }, [userId, addConversation, setActiveConversation, setMessages])

  const handleExport = useCallback(() => {
    if (messages.length === 0) {
      toast.error('No messages to export')
      return
    }
    const title = messages.find(m => m.role === 'user')?.content?.slice(0, 40) || 'AutoPilot Project'
    exportProjectToMarkdown(title, messages, tasks)
    toast.success('Project plan exported')
  }, [messages, tasks])

  return (
    <>
      <ConversationHistory open={historyOpen} onClose={() => setHistoryOpen(false)} />

      <div className="flex flex-col h-full bg-transparent overflow-hidden relative w-full">

        {/* ── Session header bar ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/[0.04] bg-[#050508]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]"
              />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Neural Session
              </span>
            </div>
            {activeSession && (
              <span className="text-[11px] font-bold text-white/70 truncate max-w-[220px]">
                — {activeSession.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all text-[10px] font-bold uppercase tracking-widest border border-transparent hover:border-white/10"
              title="Session History"
            >
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={handleExport}
              disabled={messages.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all text-[10px] font-bold uppercase tracking-widest border border-transparent hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Export session"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleNewSession}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-brand-400 hover:text-white hover:bg-brand-500/10 transition-all text-[10px] font-bold uppercase tracking-widest border border-brand-500/20 hover:border-brand-500/40 disabled:opacity-50"
              title="New session"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        {/* ── Messages area ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar flex flex-col"
        >
          <div className="max-w-3xl w-full mx-auto px-6 flex-1 flex flex-col pb-6">

            {/* Empty state */}
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center text-center px-4 py-16 my-auto">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="relative w-24 h-24 rounded-3xl bg-brand-600/10 flex items-center justify-center mb-8 border border-brand-500/20"
                >
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full"
                  />
                  <Zap className="h-10 w-10 text-brand-400 fill-brand-400/20 relative z-10" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl font-black text-white mb-3 tracking-tighter"
                >
                  Neural <span className="text-brand-500">AutoPilot</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-slate-500 max-w-sm text-sm font-medium leading-relaxed mb-10"
                >
                  Describe your business goal and 4 specialized AI agents will autonomously plan, build, market and analyze it.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl"
                >
                  {[
                    { title: 'Product Manager', desc: 'Define goals, user stories & roadmaps', icon: Rocket, msg: 'Act as Product Manager and create a complete product roadmap for a SaaS analytics tool.' },
                    { title: 'Lead Developer', desc: 'Generate architecture, code & APIs', icon: Cpu, msg: 'Act as Lead Developer and design a scalable system architecture for a real-time chat app.' },
                    { title: 'Marketing Expert', desc: 'Campaigns, GTM strategy & content', icon: Share2, msg: 'Act as Marketing Expert and create a full go-to-market strategy for a new productivity app.' },
                    { title: 'Data Analyst', desc: 'KPIs, insights & performance metrics', icon: Search, msg: 'Act as Data Analyst and define key metrics, risks and optimization recommendations for my business.' },
                  ].map((item, i) => (
                    <motion.button
                      key={item.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      onClick={() => handleSendMessage(item.msg)}
                      className="flex flex-col items-start p-5 rounded-[20px] bg-white/[0.025] border border-white/[0.06] hover:border-brand-500/30 hover:bg-white/[0.05] transition-all duration-300 group text-left relative overflow-hidden h-28"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:opacity-[0.1] transition-opacity duration-500">
                        <item.icon size={44} />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 to-brand-600/0 group-hover:from-brand-500/5 group-hover:to-brand-600/5 transition-all duration-500 rounded-[20px]" />
                      <div className="text-[9px] font-black text-brand-500 uppercase tracking-[0.25em] mb-1.5 relative z-10">
                        <Sparkles className="inline h-2.5 w-2.5 mr-1" />
                        Agent Mode
                      </div>
                      <div className="text-sm font-bold text-white mb-1 relative z-10">{item.title}</div>
                      <div className="absolute bottom-5 left-5 right-5 text-[11px] text-slate-500 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-10">
                        {item.desc}
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Live streaming message */}
              {streamingContent && (
                <ChatMessage
                  key="streaming"
                  message={{
                    id: 'streaming',
                    conversation_id: activeConversationId!,
                    role: 'agent',
                    agent_role: (thinkingAgent as any) || 'orchestrator',
                    content: streamingContent,
                    created_at: new Date().toISOString(),
                  }}
                />
              )}

              {/* Cycling agent thinking indicator while waiting for REST response */}
              {loading && thinkingAgent && !streamingContent && (
                <ThinkingIndicator key={`thinking-${thinkingAgent}`} role={thinkingAgent as any} />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 w-full pb-28 pt-3 px-4 bg-gradient-to-t from-[#050508] via-[#050508]/95 to-transparent">
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

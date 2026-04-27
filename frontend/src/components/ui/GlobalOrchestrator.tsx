'use client'

import { useEffect } from 'react'
import { useStore, AgentRole } from '@/lib/store'
import { wsClient, WSEvent } from '@/lib/websocket'
import toast from 'react-hot-toast'

/**
 * GlobalOrchestrator — The "Neural Link" of the application.
 * 
 * This component runs globally in the AppLayout and ensures that the
 * application state is always in sync with real-time agent events, 
 * regardless of which page the user is currently viewing.
 */
export default function GlobalOrchestrator() {
  const { 
    userId,
    activeConversationId, 
    addMessage,
    setAgentStatus,
    addTask,
    updateTask,
    addAgentActivity,
    setWorkflowGraph,
    setAgentsRunning,
    appendStreamChunk,
    clearStream,
    setActiveAgent
  } = useStore()

  useEffect(() => {
    if (!activeConversationId) return

    console.log(`[Orchestrator] Linking to neural session: ${activeConversationId}`)
    wsClient.connect(activeConversationId)

    // 1. Agent Thinking Events
    const offThinking = wsClient.on('agent_thinking', (e: WSEvent) => {
      const data = e.data as { agent_role: AgentRole }
      if (data?.agent_role) {
        setActiveAgent(data.agent_role)
        setAgentStatus(data.agent_role, 'thinking')
        setAgentsRunning(true)
      }
    })

    // 1.5 Message Streaming Chunks
    const offChunk = wsClient.on('stream_chunk', (e: WSEvent) => {
      const data = e.data as { chunk: string }
      appendStreamChunk(data.chunk)
    })

    // 2. Stream Done — Reset statuses
    const offDone = wsClient.on('stream_done', (e: WSEvent) => {
      clearStream()
      setActiveAgent(null)
      setAgentsRunning(false)
      const roles: AgentRole[] = ['product_manager', 'developer', 'marketing', 'analyst', 'orchestrator', 'operations']
      roles.forEach(r => setAgentStatus(r, 'idle'))
    })

    // 3. Real-time Agent Activities (Timeline updates)
    const offActivity = wsClient.on('agent_activity', (e: WSEvent) => {
      const activity = e.data as any
      addAgentActivity(activity)
      
      if (activity?.agent_role) {
        setAgentStatus(activity.agent_role, activity.status === 'completed' ? 'active' : 'thinking')
      }

      // If it's a file write, we might want to trigger a global refresh event or just rely on the user to refresh
      // For a premium feel, we could emit a custom event to FileExplorer
      if (activity?.action === 'Tool Call' && activity?.detail?.includes('write_workspace_file')) {
          // Dispatch a custom event to notify FileExplorer components
          window.dispatchEvent(new CustomEvent('workspace_files_updated'))
      }
    })

    // 4. Workflow Graph Updates (Visual orchestration)
    const offWorkflow = wsClient.on('workflow_updated', (e: WSEvent) => {
      const data = e.data as { nodes: any[]; edges: any[] }
      if (data?.nodes) {
        setWorkflowGraph(data.nodes, data.edges || [])
      }
    })

    // 5. Real-time Task Creation (Dashboard cards update)
    const offTaskCreated = wsClient.on('task_created', (e: WSEvent) => {
      addTask(e.data as any)
      // Only toast if not on the chat page to avoid double notification if chat has its own
      if (window.location.pathname !== '/chat') {
          toast.success(`Agent generated new task: ${(e.data as any).title}`, {
              icon: '🤖',
              style: {
                  borderRadius: '12px',
                  background: '#1e1b4b',
                  color: '#fff',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
              }
          })
      }
    })

    // 6. Task Updates (Status changes)
    const offTaskUpdated = wsClient.on('task_updated', (e: WSEvent) => {
      const data = e.data as { id: string; [key: string]: any }
      updateTask(data.id, data)
    })

    // 7. Agent Messages (Chat persistence)
    const offAgentMsg = wsClient.on('agent_message', (e: WSEvent) => {
      const data = e.data as any
      addMessage({
        id: data.id,
        conversation_id: activeConversationId!,
        role: 'agent',
        agent_role: data.agent_role,
        content: data.content,
        metadata: data.metadata || {},
        created_at: data.created_at || new Date().toISOString()
      })
      if (data.agent_role) {
        setActiveAgent(data.agent_role)
        setAgentStatus(data.agent_role, 'active')
        setAgentsRunning(true)
      }
    })

    return () => {
      offThinking()
      offChunk()
      offDone()
      offActivity()
      offWorkflow()
      offTaskCreated()
      offTaskUpdated()
      offAgentMsg()
      // We don't disconnect here because this is global
    }
  }, [activeConversationId, addMessage, setAgentStatus, addTask, updateTask, addAgentActivity, setWorkflowGraph, setAgentsRunning])

  return null // Pure logic component
}

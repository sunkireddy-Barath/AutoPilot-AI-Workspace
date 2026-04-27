/**
 * Zustand global state store for AutoPilot AI Workspace.
 * Manages conversations, messages, tasks, workflows, and agent state.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────────────

export type AgentRole = 'product_manager' | 'developer' | 'marketing' | 'analyst' | 'orchestrator' | 'operations'

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system' | 'agent'
  content: string
  agent_role?: AgentRole
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  conversation_id: string | null
  workflow_id: string | null
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigned_agent: AgentRole | null
  progress: number
  metadata?: {
    artifact_path?: string
    tool_output?: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

export interface WorkflowNode {
  id: string
  type: string
  data: Record<string, unknown>
  position: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  animated?: boolean
  type?: string
}

export interface AgentActivity {
  id: string
  agent_role: AgentRole
  action: string
  detail: string
  status: 'thinking' | 'active' | 'completed' | 'error'
  conversation_id: string | null
  timestamp: string
}

export interface AgentInfo {
  role: AgentRole
  name: string
  avatar: string
  color: string
  status: 'idle' | 'thinking' | 'active' | 'completed'
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  agent_role?: AgentRole
  timestamp: string
  read: boolean
}

// ── Store State Interface ──────────────────────────────────────────────

interface AppState {
  // Auth
  userId: string | null
  setUserId: (id: string | null) => void

  // Conversations
  conversations: Conversation[]
  activeConversationId: string | null
  setConversations: (list: Conversation[]) => void
  addConversation: (c: Conversation) => void
  setActiveConversation: (id: string) => void

  // Messages
  messages: Message[]
  setMessages: (msgs: Message[]) => void
  addMessage: (msg: Message) => void

  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, patch: Partial<Task>) => void

  // Workflow Graph
  workflowNodes: WorkflowNode[]
  workflowEdges: WorkflowEdge[]
  setWorkflowGraph: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void

  // Agent Activities (timeline)
  agentActivities: AgentActivity[]
  addAgentActivity: (activity: AgentActivity) => void
  setAgentActivities: (activities: AgentActivity[]) => void

  // Agent Statuses (live indicators on graph)
  agentStatuses: Record<AgentRole, AgentInfo['status']>
  setAgentStatus: (role: AgentRole, status: AgentInfo['status']) => void

  // UI State
  isAgentsRunning: boolean
  setAgentsRunning: (v: boolean) => void
  autonomousMode: boolean
  setAutonomousMode: (v: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  activeView: 'chat' | 'dashboard' | 'agents' | 'workflows' | 'insights'
  setActiveView: (v: AppState['activeView']) => void
  activeAgent: AgentRole | null
  setActiveAgent: (role: AgentRole | null) => void

  // Streaming
  streamingContent: string
  appendStreamChunk: (chunk: string) => void
  clearStream: () => void

  // Notifications
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationsRead: () => void
  clearNotifications: () => void
}

// ── Store Implementation ───────────────────────────────────────────────

// ── Initial State Helpers ─────────────────────────────────────────────

const initialWorkflowNodes: WorkflowNode[] = []

const initialWorkflowEdges: WorkflowEdge[] = []

export const useStore = create<AppState>()(
  persist(
    devtools(
      (set) => ({
        // Auth
        userId: null,
        setUserId: (id) => set({ userId: id }),

        // Conversations
        conversations: [],
        activeConversationId: null,
        setConversations: (list) => set({ conversations: list }),
        addConversation: (c) =>
          set((s) => ({ conversations: [c, ...s.conversations] })),
        setActiveConversation: (id) => set({ activeConversationId: id }),

        // Messages
        messages: [],
        setMessages: (msgs) => set({ messages: msgs }),
        addMessage: (msg) =>
          set((s) => ({ messages: [...s.messages, msg] })),

        // Tasks
        tasks: [],
        setTasks: (tasks) => set({ tasks }),
        addTask: (task) =>
          set((s) => ({ tasks: [task, ...s.tasks] })),
        updateTask: (id, patch) =>
          set((s) => ({
            tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          })),

        // Workflow Graph
        workflowNodes: initialWorkflowNodes,
        workflowEdges: initialWorkflowEdges,
        setWorkflowGraph: (nodes, edges) =>
          set({ workflowNodes: nodes, workflowEdges: edges }),

        // Agent Activities
        agentActivities: [],
        addAgentActivity: (activity) =>
          set((s) => ({
            agentActivities: [activity, ...s.agentActivities].slice(0, 100),
          })),
        setAgentActivities: (activities) => set({ agentActivities: activities }),

        // Agent Statuses
        agentStatuses: {
          product_manager: 'idle',
          developer: 'idle',
          marketing: 'idle',
          analyst: 'idle',
          orchestrator: 'idle',
          operations: 'idle',
        },
        setAgentStatus: (role, status) =>
          set((s) => ({
            agentStatuses: { ...s.agentStatuses, [role]: status },
          })),

        // UI
        isAgentsRunning: false,
        setAgentsRunning: (v) => set({ isAgentsRunning: v }),
        autonomousMode: false,
        setAutonomousMode: (v) => set({ autonomousMode: v }),
        sidebarOpen: true,
        setSidebarOpen: (v) => set({ sidebarOpen: v }),
        activeView: 'chat',
        setActiveView: (v) => set({ activeView: v }),
        activeAgent: null,
        setActiveAgent: (role) => set({ activeAgent: role }),

        // Streaming
        streamingContent: '',
        appendStreamChunk: (chunk) =>
          set((s) => ({ streamingContent: s.streamingContent + chunk })),
        clearStream: () => set({ streamingContent: '' }),

        // Notifications
        notifications: [],
        addNotification: (n) => set((s) => ({
          notifications: [{
            ...n,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            read: false
          }, ...s.notifications].slice(0, 20)
        })),
        markNotificationsRead: () => set((s) => ({
          notifications: s.notifications.map(n => ({ ...n, read: true }))
        })),
        clearNotifications: () => set({ notifications: [] }),
      }),
      { name: 'autopilot-store' }
    ),
    {
      name: 'autopilot-storage', // name of the item in storage (must be unique)
      partialize: (state) => ({ 
        userId: state.userId,
        sidebarOpen: state.sidebarOpen,
        autonomousMode: state.autonomousMode 
      }), // only persist these fields
    }
  )
)

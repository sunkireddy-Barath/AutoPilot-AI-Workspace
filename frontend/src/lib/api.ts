/**
 * API client — typed wrapper around the FastAPI backend REST endpoints.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API Error ${res.status}: ${err}`)
  }
  return res.json()
}

// ── Chat ───────────────────────────────────────────────────────────────
export const chatApi = {
  sendMessage: (payload: {
    conversation_id: string
    message: string
    user_id: string
    autonomous_mode?: boolean
  }) =>
    request('/api/v1/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

// ── Conversations ──────────────────────────────────────────────────────
export const conversationsApi = {
  list: (userId: string) =>
    request<unknown[]>(`/api/v1/conversations?user_id=${userId}`),

  create: (userId: string, title = 'New Conversation') =>
    request('/api/v1/conversations', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, title }),
    }),

  getMessages: (conversationId: string) =>
    request<unknown[]>(`/api/v1/conversations/${conversationId}/messages`),

  delete: (conversationId: string) =>
    fetch(`${API}/api/v1/conversations/${conversationId}`, { method: 'DELETE' }),
}

// ── Tasks ──────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (userId: string, conversationId?: string) => {
    const qs = conversationId
      ? `user_id=${userId}&conversation_id=${conversationId}`
      : `user_id=${userId}`
    return request<unknown[]>(`/api/v1/tasks?${qs}`)
  },

  update: (taskId: string, patch: Record<string, unknown>) =>
    request(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  delete: (taskId: string) =>
    fetch(`${API}/api/v1/tasks/${taskId}`, { method: 'DELETE' }),
}

// ── Workflows ──────────────────────────────────────────────────────────
export const workflowsApi = {
  list: (userId: string) =>
    request<unknown[]>(`/api/v1/workflows?user_id=${userId}`),
}

// ── Agent Activities ───────────────────────────────────────────────────
export const agentsApi = {
  getActivities: (conversationId?: string) => {
    const qs = conversationId ? `conversation_id=${conversationId}` : ''
    return request<unknown[]>(`/api/v1/agent-activities?${qs}&limit=50`)
  },
}

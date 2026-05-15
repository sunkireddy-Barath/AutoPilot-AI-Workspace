/**
 * WebSocket client for receiving real-time agent events.
 *
 * On Vercel serverless deployments, WebSocket connections cannot be
 * held open (functions terminate after the response). In that case
 * the client fails to connect silently and the app continues working
 * via the REST response (which now returns the full AI response body).
 */

export type WSEventType =
  | 'agent_thinking'
  | 'agent_message'
  | 'agent_collaboration'
  | 'task_created'
  | 'task_updated'
  | 'workflow_updated'
  | 'agent_activity'
  | 'stream_chunk'
  | 'stream_done'
  | 'error'

export interface WSEvent {
  event: WSEventType
  data: unknown
  conversation_id: string | null
  timestamp: string
}

type EventHandler = (event: WSEvent) => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private conversationId: string | null = null
  private handlers: Map<WSEventType, EventHandler[]> = new Map()
  private pingInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private shouldReconnect = true
  private failedAttempts = 0
  private readonly MAX_FAILURES = 3  // Stop retrying after 3 consecutive failures

  connect(conversationId: string) {
    // Already connected to this conversation — no-op
    if (this.ws?.readyState === WebSocket.OPEN && this.conversationId === conversationId) return

    this.disconnect()
    this.conversationId = conversationId
    this.shouldReconnect = true

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || 'ws://localhost:8000'

    try {
      this.ws = new WebSocket(`${wsUrl}/ws/${conversationId}`)
    } catch (err) {
      // WebSocket constructor itself threw (e.g., invalid URL) — degrade silently
      console.warn('[WS] Could not create WebSocket:', err)
      return
    }

    this.ws.onopen = () => {
      console.log(`[WS] Connected: ${conversationId}`)
      this.failedAttempts = 0
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 25_000)
    }

    this.ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data)
        // Dispatch to all registered handlers for this event type
        ;(this.handlers.get(event.event) || []).forEach((h) => h(event))
      } catch {
        // Ignore malformed messages
      }
    }

    this.ws.onclose = (evt) => {
      console.log(`[WS] Closed (code=${evt.code})`)
      this._clearPing()

      // Abnormal close on a serverless backend returns 1006 — don't retry
      const isServerlessClose = evt.code === 1006 || evt.code === 1001
      if (isServerlessClose) {
        this.failedAttempts++
      }

      if (
        this.shouldReconnect &&
        this.conversationId &&
        this.failedAttempts < this.MAX_FAILURES
      ) {
        const delay = Math.min(2000 * (this.failedAttempts + 1), 10_000)
        this.reconnectTimeout = setTimeout(() => {
          this.connect(this.conversationId!)
        }, delay)
      } else if (this.failedAttempts >= this.MAX_FAILURES) {
        console.info('[WS] Serverless environment detected — real-time streaming disabled, using REST responses.')
      }
    }

    this.ws.onerror = () => {
      // Errors are handled in onclose — suppress noisy console output
    }
  }

  on(event: WSEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, [])
    this.handlers.get(event)!.push(handler)
    return () => this.off(event, handler)
  }

  off(event: WSEventType, handler: EventHandler) {
    const list = this.handlers.get(event) || []
    this.handlers.set(event, list.filter((h) => h !== handler))
  }

  disconnect() {
    this.shouldReconnect = false
    this._clearPing()
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.conversationId = null
  }

  private _clearPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}

// Singleton — one WebSocket connection shared across the app
export const wsClient = new WebSocketClient()

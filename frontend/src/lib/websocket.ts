/**
 * WebSocket client for receiving real-time agent events.
 * Connects to ws://backend/ws/{conversationId} and dispatches
 * events to registered handlers.
 */

export type WSEventType =
  | 'agent_thinking'
  | 'agent_message'
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

  connect(conversationId: string) {
    if (this.ws && this.conversationId === conversationId) return

    this.disconnect()
    this.conversationId = conversationId
    this.shouldReconnect = true

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    this.ws = new WebSocket(`${wsUrl}/ws/${conversationId}`)

    this.ws.onopen = () => {
      console.log(`[WS] Connected to conversation ${conversationId}`)
      // Send ping every 25 seconds to keep connection alive
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 25_000)
    }

    this.ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data)
        const handlers = this.handlers.get(event.event) || []
        handlers.forEach((h) => h(event))
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      console.log('[WS] Connection closed')
      this._clearPing()
      if (this.shouldReconnect && this.conversationId) {
        this.reconnectTimeout = setTimeout(() => {
          this.connect(this.conversationId!)
        }, 2000)
      }
    }

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err)
    }
  }

  on(event: WSEventType, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
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

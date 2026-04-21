import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          agent_role: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          conversation_id: string | null
          workflow_id: string | null
          title: string
          description: string
          status: 'pending' | 'in_progress' | 'completed' | 'blocked'
          priority: 'low' | 'medium' | 'high' | 'critical'
          assigned_agent: string | null
          progress: number
          created_at: string
          updated_at: string
        }
      }
      workflows: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          status: string
          nodes: unknown[]
          edges: unknown[]
          created_at: string
          updated_at: string
        }
      }
      agent_activities: {
        Row: {
          id: string
          agent_role: string
          action: string
          detail: string
          status: string
          conversation_id: string | null
          timestamp: string
        }
      }
    }
  }
}

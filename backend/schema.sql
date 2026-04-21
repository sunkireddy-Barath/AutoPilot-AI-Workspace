-- AutoPilot AI Workspace — Database Schema (Supabase/Postgres)
-- Execute this in your Supabase SQL Editor to complete Phase 4.

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'agent')),
    content TEXT NOT NULL,
    agent_role TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    workflow_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_agent TEXT,
    progress INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Agent Activities Table
CREATE TABLE IF NOT EXISTS public.agent_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_role TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    status TEXT NOT NULL CHECK (status IN ('thinking', 'active', 'completed', 'error')),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.conversations ENABLE CONTROL;
ALTER TABLE public.messages ENABLE CONTROL;
ALTER TABLE public.tasks ENABLE CONTROL;
ALTER TABLE public.agent_activities ENABLE CONTROL;

-- Example policy for conversations
CREATE POLICY "Users can only see their own conversations" 
ON public.conversations FOR ALL 
USING (auth.uid() = user_id);

-- 6. Indices for Performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_conversation ON public.agent_activities(conversation_id);

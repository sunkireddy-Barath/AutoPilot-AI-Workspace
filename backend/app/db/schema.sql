-- ============================================================
--  AutoPilot AI Workspace — Supabase Database Schema
--  Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
--  CONVERSATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL DEFAULT 'New Conversation',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);

-- ─────────────────────────────────────────────
--  MESSAGES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'agent')),
    content          TEXT NOT NULL,
    agent_role       TEXT CHECK (agent_role IN (
                         'product_manager', 'developer',
                         'marketing', 'analyst', 'orchestrator'
                     )),
    metadata         JSONB DEFAULT '{}',
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- ─────────────────────────────────────────────
--  TASKS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id  UUID REFERENCES conversations(id) ON DELETE SET NULL,
    workflow_id      UUID,  -- FK added after workflows table
    title            TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    priority         TEXT NOT NULL DEFAULT 'medium'
                         CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_agent   TEXT CHECK (assigned_agent IN (
                         'product_manager', 'developer',
                         'marketing', 'analyst', 'orchestrator'
                     )),
    progress         INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id       ON tasks(user_id);
CREATE INDEX idx_tasks_status        ON tasks(status);
CREATE INDEX idx_tasks_workflow_id   ON tasks(workflow_id);

-- ─────────────────────────────────────────────
--  WORKFLOWS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflows (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id  UUID REFERENCES conversations(id) ON DELETE SET NULL,
    title            TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'running', 'paused', 'completed', 'failed')),
    nodes            JSONB DEFAULT '[]',
    edges            JSONB DEFAULT '[]',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);

-- Add FK from tasks → workflows now that both tables exist
ALTER TABLE tasks
    ADD CONSTRAINT fk_tasks_workflow
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
--  AGENT ACTIVITY LOG
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_activities (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_role       TEXT NOT NULL CHECK (agent_role IN (
                         'product_manager', 'developer',
                         'marketing', 'analyst', 'orchestrator'
                     )),
    action           TEXT NOT NULL,
    detail           TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('thinking', 'active', 'completed', 'error')),
    conversation_id  UUID REFERENCES conversations(id) ON DELETE SET NULL,
    workflow_id      UUID REFERENCES workflows(id) ON DELETE SET NULL,
    metadata         JSONB DEFAULT '{}',
    timestamp        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_activities_conversation_id ON agent_activities(conversation_id);
CREATE INDEX idx_agent_activities_agent_role      ON agent_activities(agent_role);
CREATE INDEX idx_agent_activities_timestamp       ON agent_activities(timestamp DESC);

-- ─────────────────────────────────────────────
--  ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

ALTER TABLE conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;

-- Conversations: users can only see their own
CREATE POLICY conversations_own ON conversations
    FOR ALL USING (auth.uid() = user_id);

-- Messages: visible if user owns the parent conversation
CREATE POLICY messages_own ON messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- Tasks: users can only see their own
CREATE POLICY tasks_own ON tasks
    FOR ALL USING (auth.uid() = user_id);

-- Workflows: users can only see their own
CREATE POLICY workflows_own ON workflows
    FOR ALL USING (auth.uid() = user_id);

-- Agent activities: visible if tied to a conversation the user owns
CREATE POLICY agent_activities_own ON agent_activities
    FOR ALL USING (
        conversation_id IS NULL OR
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- ─────────────────────────────────────────────
--  AUTO-UPDATE updated_at triggers
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
--  REALTIME PUBLICATION (for Supabase Realtime)
-- ─────────────────────────────────────────────
-- Enable realtime for live dashboard + activity timeline updates
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE workflows;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Migration: create_support_conversations_and_messages
-- Description: Support chat system - conversations and messages tables
-- Author: Dara (data-engineer)
-- Date: 2026-02-26

-- Support chat conversations (AI live chat)
CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_conversations_user ON support_conversations(user_id, created_at DESC);

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support conversations"
  ON support_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own support conversations"
  ON support_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Support chat messages
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_conversation ON support_messages(conversation_id, created_at ASC);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support messages"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_conversations sc
      WHERE sc.id = support_messages.conversation_id
      AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_conversations sc
      WHERE sc.id = support_messages.conversation_id
      AND sc.user_id = auth.uid()
    )
  );

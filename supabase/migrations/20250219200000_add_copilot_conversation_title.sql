-- Add title column to ai_copilot_conversations (editable by user)
alter table public.ai_copilot_conversations
  add column if not exists title text;

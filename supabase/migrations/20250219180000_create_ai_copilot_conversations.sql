-- Migration: AI Copilot - Histórico de conversas persistido
-- Execute no Supabase: Dashboard → SQL Editor → New query → Cole e rode.

-- =============================================================================
-- 1. Tabela ai_copilot_conversations (conversas do Copilot)
-- =============================================================================
create table if not exists public.ai_copilot_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  import_id uuid,
  account_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ai_copilot_conv_user_id on public.ai_copilot_conversations(user_id);
create index if not exists idx_ai_copilot_conv_updated on public.ai_copilot_conversations(updated_at desc);

alter table public.ai_copilot_conversations enable row level security;

create policy "Users can read own ai_copilot_conversations"
  on public.ai_copilot_conversations for select using (auth.uid() = user_id);

create policy "Users can insert own ai_copilot_conversations"
  on public.ai_copilot_conversations for insert with check (auth.uid() = user_id);

create policy "Users can update own ai_copilot_conversations"
  on public.ai_copilot_conversations for update using (auth.uid() = user_id);

create policy "Users can delete own ai_copilot_conversations"
  on public.ai_copilot_conversations for delete using (auth.uid() = user_id);

-- =============================================================================
-- 2. Tabela ai_copilot_messages (mensagens de cada conversa)
-- =============================================================================
create table if not exists public.ai_copilot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_copilot_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_ai_copilot_msg_conv_id on public.ai_copilot_messages(conversation_id);
create index if not exists idx_ai_copilot_msg_created on public.ai_copilot_messages(created_at);

alter table public.ai_copilot_messages enable row level security;

create policy "Users can read own ai_copilot_messages"
  on public.ai_copilot_messages for select
  using (
    exists (
      select 1 from public.ai_copilot_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users can insert own ai_copilot_messages"
  on public.ai_copilot_messages for insert
  with check (
    exists (
      select 1 from public.ai_copilot_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

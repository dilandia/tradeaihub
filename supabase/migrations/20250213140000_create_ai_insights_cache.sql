-- Cache de insights de IA por usuário (TTL 1 hora)
-- Reduz custos de chamadas repetidas à OpenAI

create table if not exists public.ai_insights_cache (
  user_id uuid not null references auth.users(id) on delete cascade,
  cache_key text not null,
  response text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, cache_key)
);

create index if not exists idx_ai_insights_cache_expires
  on public.ai_insights_cache(expires_at);

alter table public.ai_insights_cache enable row level security;

create policy "Users can read own ai cache"
  on public.ai_insights_cache for select using (auth.uid() = user_id);

create policy "Users can insert own ai cache"
  on public.ai_insights_cache for insert with check (auth.uid() = user_id);

create policy "Users can update own ai cache"
  on public.ai_insights_cache for update using (auth.uid() = user_id);

create policy "Users can delete own ai cache"
  on public.ai_insights_cache for delete using (auth.uid() = user_id);

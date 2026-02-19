-- Tabela para armazenar respostas do onboarding (primeira visita)
-- Usada pelo painel administrativo para entender o perfil dos usuários

create table if not exists public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experience_level text,
  instruments text[] default '{}',
  platform text,
  created_at timestamptz default now()
);

create unique index if not exists idx_onboarding_responses_user_id
  on public.onboarding_responses(user_id);

create index if not exists idx_onboarding_responses_created_at
  on public.onboarding_responses(created_at);

-- RLS
alter table public.onboarding_responses enable row level security;

create policy "Users can insert own onboarding"
  on public.onboarding_responses for insert with check (auth.uid() = user_id);

create policy "Users can read own onboarding"
  on public.onboarding_responses for select using (auth.uid() = user_id);

create policy "Users can update own onboarding"
  on public.onboarding_responses for update using (auth.uid() = user_id);

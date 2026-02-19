-- Migration: Sistema de Planos (subscriptions, ai_credits, credit_purchases)
-- Execute no Supabase: Dashboard → SQL Editor → New query → Cole e rode.
-- Estrutura preparada para integração Stripe.

-- =============================================================================
-- 1. Tabela subscriptions (plano do usuário, integração Stripe)
-- =============================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'elite')),
  billing_interval text default 'monthly' check (billing_interval in ('monthly', 'annual')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  status text default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_sub on public.subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);

create policy "Users can update own subscription"
  on public.subscriptions for update using (auth.uid() = user_id);

create policy "Users can insert own subscription"
  on public.subscriptions for insert with check (auth.uid() = user_id);

-- =============================================================================
-- 2. Tabela ai_credits (créditos de IA por usuário/ciclo)
-- =============================================================================
create table if not exists public.ai_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credits_remaining integer default 0,
  credits_used_this_period integer default 0,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create index if not exists idx_ai_credits_user_id on public.ai_credits(user_id);

alter table public.ai_credits enable row level security;

create policy "Users can read own ai_credits"
  on public.ai_credits for select using (auth.uid() = user_id);

create policy "Users can update own ai_credits"
  on public.ai_credits for update using (auth.uid() = user_id);

create policy "Users can insert own ai_credits"
  on public.ai_credits for insert with check (auth.uid() = user_id);

-- =============================================================================
-- 3. Tabela credit_purchases (compras avulsas de créditos)
-- =============================================================================
create table if not exists public.credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credits_amount integer not null,
  amount_paid_usd numeric(10,2) not null,
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

create index if not exists idx_credit_purchases_user_id on public.credit_purchases(user_id);

alter table public.credit_purchases enable row level security;

create policy "Users can read own credit_purchases"
  on public.credit_purchases for select using (auth.uid() = user_id);

-- Apenas webhook/backend insere
create policy "Service role can insert credit_purchases"
  on public.credit_purchases for insert with check (true);

-- =============================================================================
-- 4. Função: garantir subscription free para novos usuários
-- =============================================================================
create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan, billing_interval, status)
  values (new.id, 'free', 'monthly', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function public.handle_new_user_subscription();

-- =============================================================================
-- 5. Migrar usuários existentes: criar subscription free para quem não tem
-- =============================================================================
insert into public.subscriptions (user_id, plan, billing_interval, status)
select id, 'free', 'monthly', 'active'
from auth.users
on conflict (user_id) do nothing;

-- Migration: profiles + trades + RLS
-- Execute no Supabase: Dashboard → SQL Editor → New query → Cole e rode.

-- Perfis vinculados ao auth.uid()
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trades por usuário (forex journaling)
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_date date not null,
  pair text not null,
  entry_price numeric not null,
  exit_price numeric not null,
  pips numeric not null,
  is_win boolean not null,
  risk_reward numeric,
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trades_user_id on public.trades(user_id);
create index if not exists idx_trades_trade_date on public.trades(trade_date);
create index if not exists idx_trades_user_date on public.trades(user_id, trade_date);

-- RLS: profiles
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- RLS: trades
alter table public.trades enable row level security;

create policy "Users can read own trades"
  on public.trades for select using (auth.uid() = user_id);

create policy "Users can insert own trades"
  on public.trades for insert with check (auth.uid() = user_id);

create policy "Users can update own trades"
  on public.trades for update using (auth.uid() = user_id);

create policy "Users can delete own trades"
  on public.trades for delete using (auth.uid() = user_id);

-- Criar profile automaticamente quando usuário se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

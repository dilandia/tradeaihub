-- Cache persistente do calendário econômico JBlanked
-- Uma vez requisitado, serve para todos. Notícias mudam semanalmente.

create table if not exists public.economic_calendar_cache (
  cache_key text primary key,
  data jsonb not null default '[]',
  fetched_at timestamptz not null default now()
);

-- Índice para buscar por freshness (opcional)
create index if not exists idx_economic_calendar_cache_fetched_at
  on public.economic_calendar_cache(fetched_at);

-- RLS: sem policies = apenas service_role acessa (bypassa RLS)
-- A API usa service_role para ler/gravar. Anon não acessa a tabela diretamente.
alter table public.economic_calendar_cache enable row level security;

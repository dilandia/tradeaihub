# TakeZ Plan — Documentação Completa do Sistema para Deploy em VPS

Este documento descreve **toda** a arquitetura, stack, dependências e requisitos do TakeZ Plan para que você possa transferir o sistema para seu próprio VPS e dimensionar para ~100 clientes.

---

## 1. Visão Geral da Arquitetura

| Camada | Tecnologia | Observação |
|--------|------------|------------|
| **Frontend** | Next.js 15 (App Router) + React 19 | SSR, RSC, client components |
| **Backend** | Next.js API Routes (serverless) | Sem servidor separado |
| **Banco de dados** | Supabase (PostgreSQL) | Hospedado externamente |
| **Autenticação** | Supabase Auth | JWT, cookies |
| **Pagamentos** | Stripe | Webhooks, Checkout |
| **IA** | OpenAI API | GPT-4o-mini |
| **APIs externas** | MetaApi, Finnhub, Twelve Data, JBlanked | Dados de mercado e calendário |

**Modelo de deploy (seu cenário):** Next.js + PostgreSQL rodam no mesmo VPS. Auth será migrado de Supabase para solução self-hosted (ex.: NextAuth + PostgreSQL). Stripe, OpenAI e MetaApi continuam como APIs externas.

---

## 2. Stack Técnica Detalhada

### 2.1 Runtime e Framework

- **Node.js:** 18+ (recomendado 20 LTS)
- **Next.js:** 15.x (App Router)
- **React:** 19.x
- **TypeScript:** 5.6+

### 2.2 Dependências Principais (package.json)

| Pacote | Versão | Uso |
|--------|--------|-----|
| `next` | ^15.0.0 | Framework full-stack |
| `react` / `react-dom` | ^19.0.0 | UI |
| `@supabase/ssr` | ^0.8.0 | Auth/cookies server-side |
| `@supabase/supabase-js` | ^2.95.3 | Cliente Supabase |
| `stripe` | ^20.3.1 | Pagamentos |
| `openai` | ^6.22.0 | Agentes de IA |
| `recharts` | ^2.15.0 | Gráficos |
| `lightweight-charts` | ^5.1.0 | Gráficos de candles |
| `framer-motion` | ^12.34.1 | Animações |
| `html2canvas` + `jspdf` | - | Export PDF |
| `papaparse` | ^5.5.3 | Parse CSV |
| `xlsx` | ^0.18.5 | Parse Excel |
| `sonner` | ^2.0.7 | Toasts |
| `lucide-react` | ^0.460.0 | Ícones |
| `tailwindcss` | ^3.4.15 | CSS |
| `@dnd-kit/*` | - | Drag and drop |

### 2.3 Estrutura de Pastas (src/)

```
src/
├── app/                    # App Router (rotas, layouts, páginas)
│   ├── (dashboard)/        # Rotas autenticadas
│   │   ├── page.tsx        # Dashboard principal
│   │   ├── day-view/       # Visualização diária
│   │   ├── trades/         # Lista de trades
│   │   ├── economic-events/
│   │   ├── reports/        # Relatórios (Pro)
│   │   ├── ai-hub/         # Central IA (Pro)
│   │   ├── strategies/     # Em breve
│   │   ├── import/         # Importar trades
│   │   ├── takerz-score/
│   │   └── settings/        # Perfil, segurança, assinatura, contas, etc.
│   ├── api/                # API Routes (backend)
│   │   ├── stripe/         # checkout, webhook, checkout-credits
│   │   ├── ai/             # insights, risk, patterns, report-summary, takerz-score
│   │   ├── plan/           # GET plano do usuário
│   │   ├── ohlc/           # Dados de candles (Finnhub/Twelve Data)
│   │   ├── economic-calendar/
│   │   ├── jblanked-calendar/
│   │   └── mt-servers/     # Servidores MetaApi
│   ├── actions/            # Server Actions
│   │   ├── auth.ts
│   │   ├── trades.ts       # Import, CRUD trades
│   │   ├── trading-accounts.ts
│   │   ├── profile.ts, security.ts, tags.ts, trade-settings.ts
│   │   └── onboarding.ts
│   ├── layout.tsx
│   └── globals.css
├── components/             # Componentes React
├── contexts/               # React Context (plan, language, data-source)
├── hooks/
├── lib/                    # Lógica de negócio, utils, Supabase, IA, etc.
└── lib/i18n/               # Traduções PT/EN
```

---

## 3. Banco de Dados (Supabase / PostgreSQL)

### 3.1 Tabelas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfil do usuário (email, nome, avatar) |
| `trades` | Trades de forex (user_id, trade_date, pair, entry/exit, pips, is_win, tags, etc.) |
| `subscriptions` | Plano (free/pro/elite), Stripe IDs, período |
| `ai_credits` | Créditos de IA por usuário/ciclo |
| `credit_purchases` | Compras avulsas de créditos |
| `trading_accounts` | Contas MT4/MT5 vinculadas (MetaApi), credenciais criptografadas |
| `ai_insights_cache` | Cache de respostas de IA (TTL 1h) |
| `economic_calendar_cache` | Cache do calendário econômico |
| `onboarding_responses` | Respostas do onboarding |
| `import_summaries` | Histórico de importações (contagem mensal por plano) |
| `user_preferences` | Preferências de trade (FIFO/LIFO, etc.) |
| `user_tags` | Tags customizadas por usuário |

### 3.2 Migrations (supabase/migrations/)

- `20250213000000_create_profiles_and_trades.sql`
- `20250213100000_create_onboarding_responses.sql`
- `20250213120000_create_economic_calendar_cache.sql`
- `20250213140000_create_ai_insights_cache.sql`
- `20250213160000_create_subscriptions_and_credits.sql`

**Nota:** A tabela `trading_accounts` é referenciada no código. Se não existir, crie manualmente no Supabase. Schema inferido do código:

```sql
-- trading_accounts (criar manualmente se não existir)
create table if not exists public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_name text not null,
  platform text check (platform in ('MT4', 'MT5')),
  broker text not null,
  server text not null,
  login text not null,
  password_encrypted text not null,
  password_type text check (password_type in ('investor', 'master')),
  metaapi_account_id text,
  status text default 'disconnected',
  last_sync_at timestamptz,
  sync_interval_minutes int default 60,
  auto_sync_enabled boolean default false,
  profit_calc_method text check (profit_calc_method in ('FIFO', 'LIFO')),
  balance numeric default 0,
  equity numeric default 0,
  currency text default 'USD',
  leverage int,
  error_message text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- RLS e índices conforme outras tabelas
```

### 3.3 RLS (Row Level Security)

Todas as tabelas usam RLS. Políticas garantem que cada usuário acesse apenas seus próprios dados (`auth.uid() = user_id`).

---

## 4. Serviços Externos e APIs

### 4.1 Supabase (obrigatório)

- **Auth:** login, registro, sessão via cookies
- **Database:** PostgreSQL gerenciado
- **URL e chaves:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 4.2 Stripe (obrigatório para planos pagos)

- **Checkout:** assinaturas Pro/Elite e compra de créditos
- **Webhook:** `/api/stripe/webhook` — eventos de assinatura e pagamento
- **Variáveis:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Price IDs (Pro, Elite, créditos)

### 4.3 OpenAI (obrigatório para IA)

- **Modelo padrão:** `gpt-4o-mini`
- **Uso:** insights, risk, patterns, report-summary, takerz-score
- **Variável:** `OPENAI_API_KEY`

### 4.4 MetaApi (opcional — plano Pro+)

- **Uso:** sincronização de contas MT4/MT5
- **Variável:** `METAAPI_TOKEN`

### 4.5 Dados de mercado (opcional)

- **Finnhub:** `FINNHUB_API_KEY` — OHLC/candles (grátis)
- **Twelve Data:** `TWELVE_DATA_API_KEY` — fallback para OHLC
- **JBlanked:** `JB_API_KEY` — calendário econômico alternativo

### 4.6 Criptografia (obrigatório para contas MT)

- **ENCRYPTION_KEY:** 64 caracteres hex (32 bytes) para AES-256-GCM — criptografa senhas de contas MT

---

## 5. Variáveis de Ambiente Completas

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (obrigatório para billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxx
STRIPE_ELITE_MONTHLY_PRICE_ID=price_xxx
STRIPE_ELITE_ANNUAL_PRICE_ID=price_xxx
STRIPE_CREDITS_20_PRICE_ID=price_xxx
STRIPE_CREDITS_50_PRICE_ID=price_xxx
STRIPE_CREDITS_100_PRICE_ID=price_xxx

# URL da aplicação (redirects, webhooks)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# OpenAI (obrigatório para IA)
OPENAI_API_KEY=sk-...

# MetaApi (Pro/Elite - sync MT4/MT5)
METAAPI_TOKEN=xxx

# Criptografia de senhas de contas MT
ENCRYPTION_KEY=64_caracteres_hex_32_bytes

# Opcionais
FINNHUB_API_KEY=xxx
TWELVE_DATA_API_KEY=xxx
JB_API_KEY=xxx
```

---

## 6. Rotas e Endpoints

### 6.1 Páginas (frontend)

| Rota | Descrição | Plano |
|------|-----------|-------|
| `/` | Dashboard | Todos |
| `/day-view` | Visualização diária | Todos |
| `/trades` | Lista de trades | Todos |
| `/economic-events` | Calendário econômico | Todos |
| `/reports/*` | Relatórios avançados | Pro+ |
| `/ai-hub` | Central IA | Pro+ |
| `/strategies` | Estratégias (em breve) | Todos |
| `/import` | Importar trades | Todos |
| `/takerz-score` | Takerz Score | Todos |
| `/settings/*` | Configurações | Todos |

### 6.2 API Routes (backend)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/plan` | GET | Plano do usuário |
| `/api/stripe/checkout` | POST | Criar sessão Checkout (assinatura) |
| `/api/stripe/checkout-credits` | POST | Criar sessão Checkout (créditos) |
| `/api/stripe/webhook` | POST | Webhook Stripe |
| `/api/ai/insights` | POST | Insights de IA |
| `/api/ai/risk` | POST | Análise de risco |
| `/api/ai/patterns` | POST | Detecção de padrões |
| `/api/ai/report-summary` | POST | Resumo de relatório |
| `/api/ai/takerz-score` | POST | Explicação Takerz Score |
| `/api/ohlc` | GET | Dados OHLC (Finnhub/Twelve Data) |
| `/api/economic-calendar` | GET | Calendário (Finnhub) |
| `/api/jblanked-calendar` | GET | Calendário (JBlanked) |
| `/api/mt-servers` | GET | Servidores MetaApi |

### 6.3 Server Actions

- `auth.ts` — login, registro, logout
- `trades.ts` — import, CRUD trades, limites por plano
- `trading-accounts.ts` — CRUD contas MT, sync
- `profile.ts`, `security.ts`, `tags.ts`, `trade-settings.ts`, `onboarding.ts`

---

## 7. Middleware

- **Arquivo:** `src/middleware.ts`
- **Função:** Atualiza sessão Supabase, redireciona não autenticados para `/login`, autenticados em `/login` ou `/register` para `/`

---

## 8. Build e Deploy

### 8.1 Comandos

```bash
npm install
npm run build    # next build
npm run start    # next start (produção)
npm run dev      # next dev (desenvolvimento)
```

### 8.2 Output

- Next.js gera build estático + serverless functions para API routes
- `npm run start` sobe o servidor Node.js na porta 3000 (ou `PORT`)

### 8.3 Requisitos de Node

- Node.js 18.17+ (recomendado 20 LTS)
- Memória: build consome ~1–2 GB; runtime ~256–512 MB por instância

---

## 9. Dimensionamento para ~100 Clientes

### 9.1 Carga Estimada (100 usuários ativos)

- **Requisições:** ~5–20 req/min por usuário em uso médio → 500–2000 req/min no pico
- **IA:** 1–5 chamadas OpenAI por análise; Pro/Elite com 60–150 créditos/mês
- **Sync MetaApi:** Chamadas sob demanda ao sincronizar contas
- **Banco:** Supabase gerencia; conexões via pool

### 9.2 Recomendações de VPS

| Recurso | Mínimo | Recomendado | Observação |
|---------|--------|-------------|------------|
| **CPU** | 2 vCPU | 4 vCPU | Next.js é single-thread por request |
| **RAM** | 2 GB | 4 GB | Build + runtime + cache |
| **Disco** | 20 GB SSD | 40 GB SSD | Logs, cache, node_modules |
| **Rede** | 1 Gbps | 1 Gbps | Tráfego moderado |

### 9.3 Provedores Comuns

- **Hetzner:** CX22 (2 vCPU, 4 GB) ou CX32 (4 vCPU, 8 GB) — custo-benefício
- **DigitalOcean:** Droplet 4 GB ou 8 GB
- **Vultr:** 4 GB ou 8 GB
- **Linode:** 4 GB
- **Contabo:** VPS M ou L (mais barato, suporte variável)

### 9.4 O que NÃO roda no VPS

- **Supabase:** Cloud (você não hospeda PostgreSQL)
- **Stripe:** Cloud
- **OpenAI:** Cloud
- **MetaApi:** Cloud

O VPS roda **apenas** o processo Next.js (`next start`).

---

## 10. Checklist de Migração para VPS

- [ ] Contratar VPS com specs acima
- [ ] Instalar Node.js 20 LTS
- [ ] Clonar repositório
- [ ] Configurar `.env` com todas as variáveis
- [ ] Migrar de Supabase para PostgreSQL no VPS (auth, schema, dados)
- [ ] Configurar domínio e SSL (Certbot/Let's Encrypt ou Cloudflare)
- [ ] Configurar reverse proxy (Nginx ou Caddy) → `localhost:3000`
- [ ] Configurar PM2 ou systemd para manter processo ativo
- [ ] Atualizar `NEXT_PUBLIC_APP_URL` e URL do webhook Stripe
- [ ] Testar checkout, webhook e fluxos de IA

---

## 11. Segurança

- Nunca commitar `.env` ou `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` e `STRIPE_SECRET_KEY` apenas no servidor
- `ENCRYPTION_KEY` deve ser única e segura (32 bytes aleatórios em hex)
- Webhook Stripe valida assinatura com `STRIPE_WEBHOOK_SECRET`
- RLS no Supabase garante isolamento de dados por usuário

---

## 12. Resumo Executivo

| Item | Valor |
|------|-------|
| **Tipo de app** | Next.js 15 full-stack (monolito) |
| **Banco** | Supabase (PostgreSQL) — externo |
| **Auth** | Supabase Auth |
| **Billing** | Stripe |
| **IA** | OpenAI |
| **O que roda no VPS** | Apenas `next start` |
| **RAM sugerida** | 4 GB |
| **CPU sugerida** | 2–4 vCPU |
| **Disco** | 20–40 GB SSD |

---

---

## 13. Cenário: Tudo no VPS (sem Supabase/Vercel)

### 13.1 O que roda no VPS

| Serviço | Consumo estimado |
|---------|------------------|
| **Next.js** (front + back) | ~512 MB–1 GB RAM, 1–2 vCPU |
| **PostgreSQL** | ~1–2 GB RAM, 1 vCPU |
| **Agentes IA** (OpenAI via API) | CPU/RAM sob demanda; chamadas são externas |
| **Claude Code / Open Claw** | Se forem ferramentas de dev: não rodam no VPS. Se forem agentes self-hosted: +GPU ou +4–8 GB RAM |
| **Reserva** (logs, cache, PM2) | ~512 MB–1 GB RAM |

**Total:** ~4–6 GB RAM mínimo, **8 GB recomendado** para folga.  
**CPU:** 4 vCPU para 100 usuários.

---

## 14. Comparação dos Planos (Hetzner vs Hostinger)

### 14.1 Hetzner Cloud

| Plano | vCPU | RAM | SSD | Preço/mês | Custo-benefício |
|-------|------|-----|-----|-----------|-----------------|
| **CX23** (Cost-Optimized) | 2 | 4 GB | 40 GB | **$4.09** | ❌ RAM insuficiente (DB + app) |
| **CX33** (Cost-Optimized) | 4 | 8 GB | 80 GB | **$6.59** | ✅ **Melhor custo** |
| **CAX21** (Cost-Optimized) | 4 | 8 GB | 80 GB | $7.59 | ✅ Alternativa (ARM) |
| **CPX22** (Regular) | 2 | 4 GB | 80 GB | $7.59 | ❌ RAM insuficiente |
| **CPX32** (Regular) | 4 | 8 GB | 160 GB | $12.59 | ✅ Mais disco e performance |
| **CX43** (Cost-Optimized) | 8 | 16 GB | 160 GB | $10.59 | ✅ Folga para crescimento |
| **CCX13** (Dedicated) | 2 | 8 GB | 80 GB | $14.09 | ⚠️ RAM boa, CPU limitada |

### 14.2 Hostinger OpenClaw (KVM)

| Plano | vCPU | RAM | NVMe | Preço (R$) | ~USD | Observação |
|-------|------|-----|------|------------|------|-------------|
| KVM 1 | 1 | 4 GB | 50 GB | R$ 27,99 | ~$5 | ❌ RAM e CPU insuficientes |
| **KVM 2** | 2 | 8 GB | 100 GB | R$ 38,99 | ~$7,50 | ⚠️ RAM ok, CPU no limite |
| **KVM 4** | 4 | 16 GB | 200 GB | R$ 54,99 | ~$11 | ✅ Bom para 100 usuários |

**Nota:** Preços Hostinger são promocionais; renovação pode subir (ex.: R$ 69,99 para KVM 2).

---

## 15. Recomendação Final

### Para começar (MVP, ~100 clientes, sem gastar muito)

| Prioridade | Escolha | Motivo |
|------------|---------|--------|
| **1ª opção** | **Hetzner CX33** — $6.59/mês | 4 vCPU, 8 GB RAM, 80 GB SSD. Melhor custo-benefício. Suficiente para Next.js + PostgreSQL + agentes. |
| **2ª opção** | **Hetzner CX43** — $10.59/mês | 8 vCPU, 16 GB RAM, 160 GB SSD. Se quiser folga para picos e futuros agentes. |
| **3ª opção** | **Hostinger KVM 4** — R$ 54,99/mês | Se preferir provedor brasileiro e pagar em R$. 16 GB RAM, 200 GB NVMe. |

### Evitar

- **CX23, CPX22, KVM 1:** 4 GB RAM é pouco para app + PostgreSQL.
- **CCX13:** 2 vCPU pode ser gargalo para 100 usuários.
- **Dedicated (CCX):** Só vale se precisar de performance garantida; para MVP não é necessário.

### Sobre Claude Code e Open Claw

- **Claude Code / Open Claw** como ferramentas de desenvolvimento: rodam na sua máquina, não no VPS.
- **Agentes de IA do TakeZ Plan:** usam OpenAI via API; o VPS só faz as requisições HTTP.
- **Se quiser rodar modelos de IA locais** (ex.: Open Claw self-hosted): precisaria de GPU ou VPS com 16+ GB RAM e mais CPU — não recomendado para começo.

### Localização

- **Hetzner:** Alemanha (NBG1). Latência para Brasil ~200–250 ms. Aceitável para SaaS.
- **Hostinger:** Datacenters em vários países; verificar se há opção na América do Sul.
- **Alternativa:** Hetzner tem datacenter em **Helsinki (FSN1)**; latência similar. Para usuários majoritariamente no Brasil, considere futuramente um CDN (Cloudflare) na frente.

---

*Documento gerado para suporte à decisão de contratação de VPS e migração do TakeZ Plan.*

# === REGRAS GLOBAIS – TakeZ-Plan (SaaS Forex) ===
# Projeto: Journaling e análise de métricas para traders de forex
# Inspiração: TradeZella / TraderSync / TradesViz – foco acessível e forex-first

## Documentos de referência (consultar sempre)
- **Antes de implementar UI/estética/features**, ler e respeitar:
  - `estilo.md` – princípios de design, cores, tipografia, layout, componentes visuais (TradeZella dark 2026).
  - `Ideia.md` – visão do produto, concorrentes, MVP e escopo.
  - `resumo.md` – objetivos do MVP, stack e requisitos técnicos.
- Manter esses arquivos em mente em toda tarefa de front-end, design system ou nova feature.

## Stack obrigatória
- Next.js 15 App Router + React Server Components
- TypeScript strict
- Tailwind + shadcn/ui + lucide-react + Recharts
- Supabase (Auth + Postgres + Storage) – **usar MCP para operações de banco (migrations, queries, RLS)**
- Deploy: Vercel
- Tema: conforme `estilo.md` – dark #121212 bg, #1E1E2E cards, verde #10B981 lucro, vermelho #EF4444 perda, roxo scores

## Supabase via MCP
- Tudo que for necessário em relação ao Supabase deve ser feito via MCP (list_tables, apply_migration, execute_sql, etc.).
- Não hardcodar queries sensíveis no client; migrations e DDL via MCP apply_migration.
- RLS e políticas devem ser criadas/ajustadas com o MCP quando possível.

## Internacionalização (i18n)
- O site deve sempre respeitar a seleção de idiomas.
- Todo texto de UI deve estar dentro do sistema de idiomas do projeto (não deixar strings soltas em português/inglês no código).

## Estética (sempre respeitar – ver estilo.md)
- Dark mode: bg #121212, cards #1E1E2E, texto primário #E2E8F0, secundário #94A3B8.
- Lucro: verde #10B981; perda: vermelho #EF4444; scores/acentos: roxo #7C3AED / #6366F1.
- Cards arredondados (rounded-xl), padding generoso (p-6/p-8), hover suaves, shadow-lg.
- **Botões:** Sempre incluir efeitos hover (ex.: hover:bg-X/90, hover:scale-[1.02], hover:shadow-lg, transition-colors, transition-transform).
- Tipografia: Inter/Manrope/Geist Sans; headings 600-700; corpo 14-16px.
- Dashboard: cards métricas (Net P&L, Win % gauge, Profit Factor, Avg Win/Loss, Zella hexagon), heatmap mensal, line chart P&L, tabela recent trades, filtros top bar.
- Responsividade obrigatória: mobile-first (ver .cursor/rules/responsivity.md); sidebar → hamburger em mobile.

## Regras de código (não negociar)
1. Server Components por padrão; Client Components só quando precisar de interatividade (forms, charts interativos).
2. Dados do Supabase: server actions + supabase-js no server; operações via MCP quando fizer sentido (migrations, consultas ad-hoc).
3. Autenticação: Supabase Auth + RLS em todas as tabelas (trades, métricas agregadas, relatórios).
4. Upload de arquivos: CSV/Excel para import de trades → Supabase Storage + processamento no server (parse com PapaParse/XLSX).
5. Relatórios PDF/email: geração no server (PDFKit ou similar), envio via SendGrid/Nodemailer; nunca expor chaves no client.
6. UI: shadcn components; responsivo desktop e mobile.
7. Segurança: RLS + nunca SERVICE_ROLE no client; api-security-best-practices.

## Entidades principais (Supabase/Postgres)
- users (perfil vinculado ao auth.uid())
- trades (user_id, date, pair, entry_price, exit_price, pips, win, risk_reward, tags[], etc.)
- Métricas: calculadas a partir de trades (win rate, avg pips, drawdown) – podem ser cache ou views/endpoints.

## Workflow obrigatório
- Planejar com @brainstorming ou @architecture antes de features grandes.
- Implementar feature por feature (auth → import trades → dashboard → relatórios).
- Validar com @lint-and-validate; TDD light para lógica de negócio (ex.: cálculo de win rate, pips).
- Ao finalizar etapas: rodar build e, quando aplicável, @vercel-deploy-claimable.

---

# === RULES TakeZ-Plan (Next.js 15 + Supabase) ===
# Versão adaptada das 14 regras Lion Lab para o contexto Forex SaaS

## 01 - Security Isolation (LEI MAIS IMPORTANTE)
- Nunca use SUPABASE_SERVICE_ROLE_KEY no client-side (/app, /components).
- Toda escrita no banco (insert, update, delete) deve passar por Server Actions ou /api routes.
- Frontend só lê com supabase.from().select() + RLS ativado.

## 03 - RLS + Auth Shield
- Toda tabela importante deve ter RLS ativado.
- Políticas sempre baseadas em `auth.uid()` (ex: `USING (user_id = auth.uid())`).
- Nunca confie em user_id vindo do body/query → sempre pegue da sessão (getUser() no server).

## 04 - Secrets Vault
- Nunca logue env vars sensíveis (SUPABASE_URL, SERVICE_ROLE_KEY, STRIPE_SECRET, etc.).
- Use `process.env` apenas no server (nunca NEXT_PUBLIC_ com segredos).

## 05 - Session Hardening (Supabase Auth)
- Cookies de sessão: httpOnly, secure em prod, sameSite: 'lax'.
- Use `supabase.auth.getSession()` + middleware para proteger rotas (dashboard, trades, relatórios).

## 06 - Clean Architecture
- Lógica de negócio → lib/services/ ou server actions (ex.: calculateWinRate, parseMt4Csv, buildPdfReport).
- Rotas /api/* → só validação + chamada do service.
- Componentes React → só UI.

## 07 - Credential Hygiene
- Supabase Auth cuida de senha; se houver PIN ou token custom (ex.: broker API no futuro), use bcrypt/Argon2.

## 08 - Error Handling
- Nunca use try/catch vazio.
- Sempre adicione correlation ID (crypto.randomUUID()).
- Logs com contexto + stack trace.

## 09 - Dependency Hygiene
- Antes de `npm install` → npm audit; prefira pacotes mantidos (shadcn, lucide, @supabase/ssr, Recharts, etc.).

## 10 - Test First (TDD light)
- Toda feature nova → primeiro teste (ex.: cálculo de métricas, parse de CSV), depois implementação.

## 11 - API Consistency
- Padrão REST:
  GET    /api/trades
  GET    /api/trades/[id]
  POST   /api/trades          (ou /api/trades/import para upload)
  PATCH  /api/trades/[id]
  DELETE /api/trades/[id]
  GET    /api/metrics
  POST   /api/reports/generate

## 12 - Commit Discipline
- Conventional Commits: feat:, fix:, refactor:, chore:, docs:

## 13 - Env Isolation
- .env.local → desenvolvimento; .env.production na Vercel (nunca commit).
- Validar no startup se chaves críticas existem.

## 14 - Documentation Code
- Nomes claros (calculateWinRate, importTradesFromCsv, generateReportPdf).
- JSDoc em funções importantes; README atualizado com setup.

---

Modo: **TakeZ-Plan Architect**. Construa com velocidade, segurança e foco no MVP: auth, import de trades (CSV/Excel MT4/MT5 + manual), dashboard de métricas, relatórios PDF/email. Sem over-engineering: nada de AI, backtesting ou comunidade no MVP.

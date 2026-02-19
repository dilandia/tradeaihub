# === REGRAS GLOBAIS – TakeZ-Plan (SaaS Forex) ===
# Projeto: Journaling e análise de métricas para traders de forex
# Inspiração: TradeZella / TraderSync / TradesViz – foco acessível e forex-first

## Documentos de referência (consultar sempre)
- Antes de implementar UI/estética/features, ler: `estilo.md`, `Ideia.md`, `resumo.md`.
- Manter em mente em toda tarefa de front-end, design system ou nova feature.

## Stack obrigatória
- Next.js 15 App Router + React Server Components
- TypeScript strict
- Tailwind + shadcn/ui + lucide-react
- Supabase (Auth + Postgres + Storage) – **usar MCP para operações de banco (migrations, queries, RLS)**
- Deploy: Vercel
- Tema: DARK (#111 background) + acento principal (ex.: dourado #665500 ou verde/âmbar para trading)

## Supabase via MCP
- Tudo que for necessário em relação ao Supabase deve ser feito via MCP (list_tables, apply_migration, execute_sql, etc.).
- Não hardcodar queries sensíveis no client; migrations e DDL via MCP apply_migration.
- RLS e políticas devem ser criadas/ajustadas com o MCP quando possível.

## Internacionalização (i18n)
- O site deve sempre respeitar a seleção de idiomas.
- Todo texto de UI deve estar dentro do sistema de idiomas do projeto (não deixar strings soltas em português/inglês no código).

## Estética (sempre respeitar)
- Dark mode (#111), cards arredondados, hover suaves, sombras sutis.
- Dashboard clean: KPIs (win rate, pips, drawdown), gráficos (Recharts/Chart.js), tabela de trades.
- Foco em legibilidade de números e datas (formatação de pips, %, moeda).
- Responsividade obrigatória: mobile-first (ver .cursor/rules/responsivity.md).

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

# === RULES TakeZ-Plan (14 regras Lion Lab adaptadas) ===

## 01 - Security Isolation (LEI MAIS IMPORTANTE)
- Nunca use SUPABASE_SERVICE_ROLE_KEY no client-side (/app, /components).
- Toda escrita no banco deve passar por Server Actions ou /api routes.
- Frontend só lê com supabase.from().select() + RLS ativado.

## 03 - RLS + Auth Shield
- Toda tabela importante com RLS; políticas baseadas em `auth.uid()`.
- user_id sempre da sessão, nunca do body/query.

## 04 - Secrets Vault
- Nunca logue env sensíveis; process.env apenas no server.

## 05 - Session Hardening (Supabase Auth)
- Cookies httpOnly, secure em prod, sameSite: 'lax'; middleware para rotas protegidas.

## 06 - Clean Architecture
- Lógica → lib/services/ ou server actions; /api/* só validação + service; componentes só UI.

## 07 - Credential Hygiene
- Supabase Auth para senha; bcrypt/Argon2 para PIN/token custom se necessário.

## 08 - Error Handling
- Sem try/catch vazio; correlation ID; logs com contexto e stack.

## 09 - Dependency Hygiene
- npm audit antes de install; pacotes mantidos e populares.

## 10 - Test First (TDD light)
- Teste antes para features novas (métricas, parse CSV); depois implementar.

## 11 - API Consistency
- REST: GET/POST/PATCH/DELETE /api/trades, GET /api/metrics, POST /api/reports/generate.

## 12 - Commit Discipline
- Conventional Commits: feat:, fix:, refactor:, chore:, docs:

## 13 - Env Isolation
- .env.local (dev); .env.production na Vercel; validar chaves no startup.

## 14 - Documentation Code
- Nomes claros (calculateWinRate, importTradesFromCsv); JSDoc em funções importantes; README atualizado.

---

Modo: **TakeZ-Plan Architect**. MVP: auth, import trades (CSV/Excel MT4/MT5 + manual), dashboard de métricas, relatórios PDF/email. Sem AI, backtesting ou comunidade no MVP.

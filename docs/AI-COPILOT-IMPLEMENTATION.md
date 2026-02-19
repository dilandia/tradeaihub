# AI Copilot — Guia de Implementação

## Visão Geral

O **AI Copilot** é um assistente conversacional que permite ao usuário fazer perguntas em linguagem natural sobre seus trades, métricas e relatórios. O agente analisa os dados reais do usuário e responde com insights práticos, números e recomendações.

**Restrição:** Disponível **apenas no plano Elite**.

**Referência visual:** Supertrader (prints enviadas) — interface de chat com bolhas de mensagem, resposta com métricas estruturadas e disclaimer.

---

## 1. O que será construído

### 1.1 Interface de chat
- **Rota:** `/ai-copilot` (ou `/ai` para consistência com Supertrader)
- **Layout:** Chat full-screen ou em painel principal
- **Elementos:**
  - Área de mensagens (scroll automático)
  - Input de texto + botão enviar
  - Bolhas de mensagem:
    - **Usuário:** à direita, cor accent (roxo/score)
    - **AI:** à esquerda, fundo neutro (card/muted)
  - Timestamp em cada mensagem
  - Ícone de raio (⚡) ao lado das respostas da AI
  - Disclaimer: *"AI assistant, not financial advice"* em todas as respostas

### 1.2 Resposta da AI
- Resposta direta e objetiva no início
- Quando aplicável: **bloco de métricas** formatado (ex.: "Your Risk Amount Summary:")
  - Bullets com valores (Average risk per trade, Max Risk, Risk Consistency Score, etc.)
  - Ícones de tendência (▲ ▼) quando relevante
- Markdown suportado (listas, negrito, etc.)
- Sempre incluir disclaimer no final

### 1.3 Sugestões rápidas (sidebar ou cards)
- **Just Ask** — "Natural queries" — destaque para perguntas em linguagem natural
- **Live Preview** — preview em tempo real (opcional na v1)
- **Save Hours** — "Instant insights" — respostas rápidas baseadas em dados
- **More Than Data** — "Strategy advice" — recomendações práticas

Esses cards podem ser **sugestões de perguntas** clicáveis que preenchem o input.

### 1.4 Gate de plano
- Apenas usuários **Elite** acessam o AI Copilot
- Free e Pro: redirecionar ou mostrar modal de upgrade com CTA para Elite

---

## 2. Arquitetura Técnica

### 2.1 Fluxo de dados

```
[Usuário digita pergunta]
       ↓
[Frontend envia POST /api/ai/copilot]
       ↓
[API: 1. Checa plano Elite]
[API: 2. Checa créditos AI]
[API: 3. Busca trades + métricas do usuário]
[API: 4. Monta contexto (system prompt) com dados]
[API: 5. Chama OpenAI com user message + context]
[API: 6. Consome créditos]
       ↓
[Resposta retornada ao frontend]
       ↓
[Exibe na bolha da AI]
```

### 2.2 Contexto enviado ao modelo

O system prompt deve incluir:
- **Métricas agregadas:** win rate, profit factor, net P&L, avg win/loss, max drawdown, day win %, etc.
- **Resumo de trades:** total, wins, losses, por período
- **Métricas de risco:** risk consistency score (se calculável), avg risk per trade
- **Dados de relatórios:** overview, performance, risk (resumos numéricos)
- **Instruções:** responder em linguagem natural, ser direto, incluir números quando relevante, sempre adicionar disclaimer

### 2.3 Consumo de créditos
- Cada mensagem do Copilot consome créditos (ex.: 2–3 por troca, ou 1 por mensagem do usuário + 1–2 pela resposta)
- Usar `checkAiCredits` e `consumeCreditsAfterSuccess` existentes em `src/lib/ai/plan-gate.ts`
- Elite tem 150 créditos/mês — o Copilot usa o mesmo pool

---

## 3. Passo a Passo de Implementação

### Fase 1: Backend e Gate

#### Passo 1.1 — Adicionar `canUseAiCopilot` ao plano
- **Arquivo:** `src/lib/plan.ts`
- Adicionar em `PlanInfo`: `canUseAiCopilot: boolean`
- Em `PLAN_LIMITS`: `free: false`, `pro: false`, `elite: true`
- Atualizar `buildPlanInfo()` para incluir o novo campo

#### Passo 1.2 — Adicionar `canUseAiCopilot` ao PlanContext
- **Arquivo:** `src/contexts/plan-context.tsx`
- Adicionar `canUseAiCopilot: () => boolean` ao contexto
- Implementar: `planInfo?.canUseAiCopilot ?? false`

#### Passo 1.3 — Criar API route `/api/ai/copilot`
- **Arquivo:** `src/app/api/ai/copilot/route.ts`
- **Método:** POST
- **Body:** `{ message: string, importId?: string, accountId?: string, locale?: string }`
- **Lógica:**
  1. Autenticar usuário (Supabase)
  2. Buscar plano — se não for Elite, retornar 403 com `code: "plan"` e mensagem de upgrade
  3. Checar créditos (`checkAiCredits`)
  4. Buscar trades (getTrades) e métricas (buildPerformanceMetrics, buildRadarMetrics, etc.)
  5. Montar system prompt com dados
  6. Chamar OpenAI (chat completions)
  7. Consumir créditos
  8. Retornar `{ content: string }`

#### Passo 1.4 — Criar prompt do Copilot
- **Arquivo:** `src/lib/ai/prompts/copilot.ts`
- Função `buildCopilotSystemPrompt(metrics, tradesSummary, locale): string`
- Incluir:
  - Role: "You are an AI trading assistant. The user can ask questions about their trading performance. Use ONLY the data provided. Be direct and practical."
  - Métricas em formato estruturado (JSON ou texto)
  - Instrução: "Always end your response with: *AI assistant, not financial advice*"
  - Instrução: "When the question is about risk, consistency, or numbers, format a clear summary with bullet points and specific values."

---

### Fase 2: Página e UI

#### Passo 2.1 — Criar página `/ai-copilot`
- **Arquivo:** `src/app/(dashboard)/ai-copilot/page.tsx`
- Server Component que:
  - Verifica se usuário está autenticado
  - Busca plano (getUserPlan)
  - Se não Elite: redireciona para `/settings/subscription` ou renderiza `UpgradePlanModal` com CTA Elite
  - Se Elite: renderiza `AiCopilotContent` (client component)

#### Passo 2.2 — Componente `AiCopilotContent`
- **Arquivo:** `src/components/ai/ai-copilot-content.tsx`
- Estado: `messages: { role: 'user' | 'assistant', content: string, timestamp: Date }[]`
- Estado: `input`, `isLoading`
- Layout:
  - Header com título "AI Copilot" e créditos restantes
  - Área de mensagens (scroll automático)
  - Componente `CopilotMessage` para cada mensagem
  - Input + botão enviar
  - Sidebar ou cards com sugestões de perguntas (opcional na v1)

#### Passo 2.3 — Componente `CopilotMessage`
- **Arquivo:** `src/components/ai/copilot-message.tsx`
- Props: `role`, `content`, `timestamp`
- Se `role === 'user'`: bolha à direita, cor score
- Se `role === 'assistant'`: bolha à esquerda, ícone ⚡, renderizar markdown (`AiResponseContent` ou similar)
- Timestamp formatado

#### Passo 2.4 — Adicionar link no sidebar
- **Arquivo:** `src/components/sidebar.tsx`
- Adicionar item "AI Copilot" com ícone (MessageCircle ou Sparkles)
- Badge "Elite" ao lado
- `href="/ai-copilot"`
- Usar `canUseAiCopilot()` para mostrar ou esconder (ou mostrar com badge "Elite" e gate na página)

---

### Fase 3: Agente Inteligente

#### Passo 3.1 — Enriquecer o system prompt
- Incluir métricas de risco: risk consistency score, avg risk per trade, max risk
- Incluir resumo de relatórios: overview, performance, risk
- Instruções para tipos de pergunta:
  - "Am I risking consistent amounts?" → Calcular e responder com Risk Amount Summary
  - "How am I performing?" → Resumo com win rate, P&L, profit factor
  - "What should I improve?" → Sugestões baseadas em métricas fracas
  - "Best/worst day?" → Dados do calendário

#### Passo 3.2 — Funções de cálculo adicionais (se necessário)
- **Risk Consistency Score:** desvio padrão do risk por trade normalizado (0–100)
- Reutilizar `buildPerformanceMetrics`, `buildRadarMetrics` de `dashboard-calc.ts` e `reports-calc.ts`

#### Passo 3.3 — Histórico de conversa (opcional v2)
- Manter últimas N mensagens no contexto da API para follow-up
- Ou salvar em `ai_copilot_conversations` no Supabase (v2)

---

### Fase 4: Landing Page (Feature Poderosa)

#### Passo 4.1 — Nova seção "Powerful Features"
- **Arquivo:** `src/components/landing/landing-page.tsx`
- Adicionar seção antes ou depois de "Benefits"
- Título: "Everything you need to trade smarter"
- Subtítulo: "A complete suite of tools designed by traders, for traders. From journaling to AI-powered analytics."
- Row de ícones: Analytics, Journal, Mental, Backtest, Calendar, **AI Copilot** (destaque), Coaching, Integrations, Mobile

#### Passo 4.2 — Card "AI-Powered Insights" / "AI Copilot"
- Layout em 2 colunas (desktop):
  - **Esquerda:** Descrição do AI Copilot
    - Título: "AI-Powered Insights" ou "AI Copilot"
    - Texto: "Get intelligent analysis and personalized suggestions to improve your trading strategy."
    - Bullets: Pattern recognition, Behavior analysis, Trade recommendations, Natural language queries
    - "GPT-4 Powered" ou similar
    - Botão: "Try AI Copilot Free" → link para `/register` ou `/ai-copilot` (com gate)
  - **Direita:** Mockup/screenshot do chat
    - Janela simulada com `app.tradeaihub.com/ai-copilot`
    - Exemplo de conversa: "Am I risking consistent amounts?" → resposta com Risk Amount Summary
    - Disclaimer visível

#### Passo 4.3 — Traduções i18n
- Adicionar chaves em `pt-BR.json` e `en.json`:
  - `landing.aiCopilotTitle`, `landing.aiCopilotDesc`
  - `landing.aiCopilotBullet1`, etc.
  - `landing.aiCopilotCta`

---

## 4. Estrutura de Arquivos

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── ai-copilot/
│   │       └── page.tsx
│   └── api/
│       └── ai/
│           └── copilot/
│               └── route.ts
├── components/
│   └── ai/
│       ├── ai-copilot-content.tsx
│       ├── copilot-message.tsx
│       └── copilot-suggestions.tsx  (opcional)
├── lib/
│   └── ai/
│       └── prompts/
│           └── copilot.ts
└── contexts/
    └── plan-context.tsx  (atualizar)
```

---

## 5. Exemplo de System Prompt (Copilot)

```
You are an AI trading assistant for TakeZ Plan. The user can ask questions in natural language about their trading performance, risk, consistency, and strategy. Use ONLY the data provided below. Be direct, practical, and concise.

## User's trading data (current period)

- Total trades: {totalTrades}
- Wins: {wins} | Losses: {losses}
- Win rate: {winRate}%
- Net P&L: ${netPnl} (or {netPips} pips)
- Profit factor: {profitFactor}
- Avg win: ${avgWin} | Avg loss: ${avgLoss}
- Day win %: {dayWinPct}%
- Max drawdown: ${maxDrawdown}
- Risk consistency score: {riskConsistencyScore}/100
- Max risk per trade: ${maxRiskPerTrade}
- Avg risk per trade: ${avgRiskPerTrade}

## Instructions

1. Answer in the user's language ({locale}).
2. When the question is about risk or consistency, provide a "Summary" block with bullet points and specific values.
3. Use ▲ for improvement/positive and ▼ for decline/negative when showing trends.
4. Be actionable: suggest one concrete next step when relevant.
5. ALWAYS end your response with: *AI assistant, not financial advice*
```

---

## 6. Sugestões de Perguntas (Cards clicáveis)

| Sugestão | Label | Query |
|----------|-------|-------|
| Just Ask | Natural queries | "Am I risking consistent amounts?" |
| Save Hours | Instant insights | "Give me a quick summary of my performance" |
| More Than Data | Strategy advice | "What should I improve based on my numbers?" |
| — | — | "What's my best and worst trading day?" |
| — | — | "Am I overtrading?" |
| — | — | "How consistent is my win rate?" |

---

## 7. Checklist de Implementação

### Backend
- [ ] `canUseAiCopilot` em `plan.ts` e `plan-context.tsx`
- [ ] API route `/api/ai/copilot`
- [ ] Prompt em `lib/ai/prompts/copilot.ts`
- [ ] Integração com créditos (check + consume)
- [ ] Cálculo de risk consistency score (se não existir)

### Frontend
- [ ] Página `/ai-copilot` com gate Elite
- [ ] `AiCopilotContent` com chat
- [ ] `CopilotMessage` com bolhas e markdown
- [ ] Link no sidebar com badge Elite
- [ ] Sugestões de perguntas (cards clicáveis)

### Landing
- [ ] Seção "Powerful Features" com ícones
- [ ] Card "AI Copilot" com mockup do chat
- [ ] Traduções i18n

### Testes
- [ ] Usuário Free/Pro não acessa `/ai-copilot` (redirect ou modal)
- [ ] Usuário Elite consegue enviar mensagem e receber resposta
- [ ] Créditos são consumidos
- [ ] Disclaimer aparece em todas as respostas
- [ ] Responsivo (mobile)

---

## 8. Próximos Passos (Fase 2 / Melhorias)

- Histórico de conversas persistido no banco
- "Live Preview" — preview da resposta em tempo real (streaming)
- Sugestões contextuais baseadas nas métricas (ex.: "Sua consistência de risco está baixa. Quer saber mais?")
- Integração com relatórios específicos (Overview, Risk) para respostas mais ricas

---

*Documento criado para guiar a implementação do AI Copilot — TakeZ Plan.*

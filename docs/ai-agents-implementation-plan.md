# Plano de Implementação de Agentes de IA – TakeZ Plan

> Documento de planejamento para integração de múltiplos agentes de IA na plataforma TakeZ Plan, com base nos widgets, relatórios e dados existentes.

## Recomendação de LLM

**OpenAI GPT-4o-mini** – Melhor custo/benefício para a maioria dos casos. Respostas rápidas e de boa qualidade.

**OpenAI GPT-4o** – Use quando precisar de análises mais complexas ou maior precisão. Custo maior.

Alternativas: Anthropic Claude (via API) para cenários que exigem textos mais longos ou raciocínio mais profundo.

---

## 1. Visão Geral da Plataforma

### 1.1 Dados Disponíveis

| Entidade | Campos Principais |
|----------|-------------------|
| **Trades** | `trade_date`, `pair`, `entry_price`, `exit_price`, `pips`, `is_win`, `risk_reward`, `tags`, `notes`, `entry_time`, `exit_time`, `duration_minutes`, `profit_dollar`, `trading_account_id` |
| **Import Summary** | `total_trades`, `profit_factor`, `sharpe_ratio`, `max_consecutive_wins/losses`, `win_rate`, `drawdown`, etc. |
| **Trading Accounts** | Contas MT4/MT5 via MetaApi |
| **Tags** | Categorização de trades |
| **Calendário Econômico** | Eventos com impacto (high/medium/low) |

### 1.2 Widgets Existentes

| Widget | Função | Dados Utilizados |
|--------|--------|------------------|
| **Net PnL** | P&L líquido (pips ou $) | trades filtrados |
| **Win Rate** | Taxa de acerto % | wins / total |
| **Profit Factor** | Lucro bruto / perda bruta | pips ou $ |
| **Cumulative PnL Chart** | Gráfico acumulado | trades ao longo do tempo |
| **Zella/Radar Chart** | Métricas em radar | win rate, PF, RR, etc. |
| **Net Daily PnL** | P&L por dia | trades por data |
| **Heatmap** | Calendário de performance | trades por dia |
| **Mini Calendar** | Calendário compacto | trades por dia |
| **Yearly Calendar** | Visão anual | trades por mês/ano |
| **Recent Trades** | Últimos trades | lista de trades |
| **Report Metrics** | KPIs do relatório | métricas calculadas |

### 1.3 Relatórios Existentes

| Relatório | Função |
|-----------|--------|
| **Overview** | Visão geral de performance |
| **Performance** | Métricas detalhadas de performance |
| **Compare** | Comparação entre períodos/contas |
| **Calendar** | Performance por calendário |
| **Day-Time** | Análise por dia da semana e horário |
| **Symbols** | Performance por par/símbolo |
| **Risk** | Análise de risco e drawdown |
| **Strategies** | Performance por estratégia (tags) |
| **Tags** | Performance por tags |
| **Options Day Till Expiration** | Análise de opções por DTE |
| **Wins vs Losses** | Comparativo wins vs losses |

---

## 2. Agentes de IA Propostos

### 2.1 Agente de Insights de Performance (Performance Insights Agent)

**Onde atua:** Dashboard, página AI Insights, relatórios Performance/Overview

**Função:**
- Analisar métricas (win rate, profit factor, Takerz Score, drawdown)
- Identificar tendências (melhora/piora ao longo do tempo)
- Comparar períodos e sugerir conclusões
- Gerar resumos em linguagem natural

**Como fará:**
1. Recebe `ClientMetrics` ou `Metrics` + histórico de trades agregados
2. Usa LLM para interpretar os números
3. Retorna insights estruturados (bullet points, recomendações)
4. Pode ser acionado sob demanda ou em background (cache)

**Exemplo de output:**
> "Seu win rate subiu 8% nos últimos 30 dias em relação aos 30 anteriores. O profit factor em EUR/USD está em 2.1, acima da média geral. Considere revisar trades em GBP/JPY, onde o win rate caiu para 42%."

---

### 2.2 Agente de Detecção de Padrões (Pattern Detection Agent)

**Onde atua:** AI Insights, relatório Day-Time, relatório Symbols

**Função:**
- Identificar padrões em wins vs losses (ex: perde mais às segundas)
- Detectar horários/sessões mais lucrativas
- Encontrar pares onde o trader performa melhor ou pior
- Correlacionar tags/estratégias com resultado

**Como fará:**
1. Recebe trades com `entry_time`, `pair`, `tags`, `is_win`
2. Agrupa por dia da semana, hora, par, tag
3. Calcula métricas por grupo
4. LLM interpreta e destaca padrões significativos
5. Retorna lista de padrões com evidência numérica

**Exemplo de output:**
> "Você tem 68% de win rate em trades entre 14h-18h UTC. Trades em XAU/USD após 20h têm win rate de 38%. Considere evitar esse horário nesse par."

---

### 2.3 Agente de Análise de Risco (Risk Analysis Agent)

**Onde atua:** Relatório Risk, Dashboard (widget de risco), AI Insights

**Função:**
- Avaliar drawdown e sequências de perdas
- Sugerir ajustes de tamanho de posição
- Alertar sobre períodos de risco elevado
- Relacionar risk/reward com resultado real

**Como fará:**
1. Recebe dados de drawdown, max consecutive losses, avg RR
2. Compara com benchmarks (ex: max drawdown aceitável)
3. LLM gera recomendações práticas
4. Pode incluir sugestões de stop-loss ou gestão de risco

**Exemplo de output:**
> "Sua maior sequência de perdas foi 7 trades (-340 pips). O drawdown relativo atingiu 12%. Recomendamos reduzir o tamanho da posição em 20% até recuperar a consistência."

---

### 2.4 Agente de Resumo de Relatório (Report Summary Agent)

**Onde atua:** Cada página de relatório (Overview, Performance, Compare, etc.)

**Função:**
- Gerar resumo executivo do relatório em 2–3 frases
- Destacar os 3 principais achados
- Sugerir uma ação concreta baseada nos dados

**Como fará:**
1. Recebe os dados já calculados do relatório (métricas, tabelas)
2. LLM sintetiza em texto curto
3. Exibido no topo ou em card colapsável do relatório
4. Opcional: botão "Gerar resumo" para sob demanda

**Exemplo de output:**
> "No período selecionado, seu profit factor foi 1.8 com win rate de 58%. O par mais lucrativo foi EUR/USD (+120 pips). Recomendação: manter foco em EUR/USD e revisar estratégia em GBP/JPY."

---

### 2.5 Agente de Sugestões de Trades (Trade Suggestions Agent)

**Onde atua:** Página de Trades, ao adicionar/editar trade

**Função:**
- Sugerir tags com base em par, horário, resultado
- Completar notas automaticamente (ex: "trade de breakout em suporte")
- Alertar sobre padrões de erro (ex: "você costuma perder nesse par nesse horário")

**Como fará:**
1. Recebe trade em edição (par, horário, preços, etc.)
2. Consulta histórico do usuário para padrões
3. LLM sugere tags e nota opcional
4. Usuário pode aceitar ou ignorar

---

### 2.6 Agente de Calendário Econômico (Economic Calendar Agent)

**Onde atua:** Página Economic Events

**Função:**
- Explicar impacto de eventos no trading do usuário (pares que ele negocia)
- Sugerir quais eventos acompanhar com base no histórico
- Resumir resultado de eventos passados (actual vs forecast)
- Alertas personalizados (ex: "NFP hoje – evite EUR/USD até o release")

**Como fará:**
1. Recebe lista de pares que o usuário negocia (extraído dos trades)
2. Cruza com eventos econômicos (moedas, impacto)
3. LLM gera contexto e recomendações
4. Pode integrar com dados de OHLC pós-evento (MetaApi/Finnhub)

---

### 2.7 Agente de Comparação (Compare Agent)

**Onde atua:** Relatório Compare

**Função:**
- Comparar dois períodos ou duas contas
- Explicar diferenças em linguagem natural
- Sugerir qual período/estratégia foi melhor e por quê

**Como fará:**
1. Recebe métricas do período A e período B (ou conta A vs B)
2. Calcula deltas (win rate, PF, etc.)
3. LLM interpreta e gera narrativa comparativa
4. Destaca fatores que mais contribuíram para a diferença

---

### 2.8 Agente de Onboarding / Tutorial (Onboarding Agent)

**Onde atua:** Primeiro acesso, tutorial, empty states

**Função:**
- Guiar o usuário nas primeiras ações (importar trades, configurar conta)
- Explicar widgets e relatórios quando vazios
- Sugerir próximos passos baseado no que o usuário já fez

**Como fará:**
1. Recebe estado do usuário (tem trades? tem conta vinculada? completou onboarding?)
2. LLM gera mensagem contextual e próxima ação sugerida
3. Pode ser regras simples (if/else) + LLM para personalização

---

## 3. Arquitetura Técnica Proposta

### 3.1 Fluxo de Dados

```
[Frontend] → [API Route] → [Agent Service] → [LLM Provider]
                ↓
         [Supabase] (trades, metrics)
```

### 3.2 Estrutura de Pastas Sugerida

```
src/
├── app/api/
│   └── ai/
│       ├── insights/route.ts      # Performance Insights
│       ├── patterns/route.ts     # Pattern Detection
│       ├── risk/route.ts         # Risk Analysis
│       ├── report-summary/route.ts
│       ├── trade-suggestions/route.ts
│       ├── economic-context/route.ts
│       └── compare/route.ts
├── lib/
│   └── ai/
│       ├── agents/
│       │   ├── performance-insights.ts
│       │   ├── pattern-detection.ts
│       │   ├── risk-analysis.ts
│       │   ├── report-summary.ts
│       │   ├── trade-suggestions.ts
│       │   ├── economic-context.ts
│       │   └── compare.ts
│       ├── prompts/
│       │   └── *.ts              # Prompts por agente
│       └── client.ts              # Cliente LLM (OpenAI/Anthropic)
```

### 3.3 Considerações

- **Custo:** Limitar tokens por request; usar cache para insights que não mudam frequentemente
- **Latência:** Agentes sob demanda (click) vs background (cache de 1h)
- **Idiomas:** Prompts e outputs devem respeitar `useLanguage()` (pt-BR, en)
- **Rate limit:** Por usuário e por plano (Elite pode ter mais chamadas)

---

## 4. Passo a Passo de Implementação

### Fase 1 – Fundação (1–2 semanas)

| # | Tarefa | Descrição |
|---|--------|-----------|
| 1.1 | Configurar cliente LLM | Criar `lib/ai/client.ts` com OpenAI ou Anthropic, variáveis de ambiente |
| 1.2 | Criar estrutura de pastas | `lib/ai/agents/`, `lib/ai/prompts/` |
| 1.3 | Implementar agente de Report Summary | Mais simples, recebe JSON e retorna texto; usar em 1 relatório como POC |
| 1.4 | API route `/api/ai/report-summary` | POST com `{ reportType, metrics, tradesSummary }` |
| 1.5 | Integrar no relatório Overview | Card "Resumo IA" com botão "Gerar" |

### Fase 2 – Agentes Core (2–3 semanas)

| # | Tarefa | Descrição |
|---|--------|-----------|
| 2.1 | Performance Insights Agent | Prompt + lógica para receber `Metrics` e histórico |
| 2.2 | Integrar na página AI Insights | Substituir "Coming soon" por agente real |
| 2.3 | Pattern Detection Agent | Agrupar trades por dia/hora/par; prompt para padrões |
| 2.4 | Integrar no Day-Time report | Seção "Padrões identificados" |
| 2.5 | Risk Analysis Agent | Usar dados do relatório Risk |
| 2.6 | Integrar no relatório Risk | Card de recomendações |

### Fase 3 – Agentes Avançados (2–3 semanas)

| # | Tarefa | Descrição |
|---|--------|-----------|
| 3.1 | Compare Agent | Dois conjuntos de métricas → narrativa comparativa |
| 3.2 | Trade Suggestions Agent | Ao editar trade, sugerir tags e nota |
| 3.3 | Economic Calendar Agent | Cruzar pares do usuário com eventos |
| 3.4 | Onboarding Agent | Mensagens contextuais em empty states |

### Fase 4 – Refinamento e Escala (1–2 semanas)

| # | Tarefa | Descrição |
|---|--------|-----------|
| 4.1 | Cache de insights | Redis ou Supabase para cache por usuário/período |
| 4.2 | Rate limiting | Por plano (Free/Pro/Elite) |
| 4.3 | i18n | Todos os prompts e respostas no sistema de idiomas |
| 4.4 | Testes | Unit tests para prompts e integração |
| 4.5 | Monitoramento | Log de uso, custo por agente, erros |

---

## 5. Priorização Recomendada

| Prioridade | Agente | Motivo |
|------------|--------|-------|
| P0 | Report Summary | POC rápido, valor imediato em relatórios |
| P0 | Performance Insights | Core da página AI Insights, já prometido |
| P1 | Pattern Detection | Diferencial forte, usa Day-Time e Symbols |
| P1 | Risk Analysis | Alto valor para traders |
| P2 | Compare Agent | Complementa relatório Compare |
| P2 | Trade Suggestions | Melhora UX ao registrar trades |
| P3 | Economic Calendar Agent | Depende de integração com eventos |
| P3 | Onboarding Agent | Pode começar com regras simples |

---

## 6. Métricas de Sucesso

- **Adoção:** % de usuários que usam pelo menos 1 agente por mês
- **Satisfação:** Feedback ou NPS após uso
- **Retenção:** Usuários que voltam a usar agentes
- **Custo:** Tokens/usuário/mês, manter dentro do orçamento
- **Latência:** Tempo médio de resposta < 5s para insights sob demanda

---

## 7. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Custo de LLM alto | Cache, rate limit, prompts curtos |
| Respostas genéricas | Prompts com contexto rico (métricas reais, exemplos) |
| Alucinações | Validar números no prompt; não inventar dados |
| Latência | Loading states; considerar streaming para textos longos |
| Privacidade | Dados só do usuário; não treinar modelos com dados |

---

*Documento criado em fev/2025. Atualizar conforme evolução do produto.*

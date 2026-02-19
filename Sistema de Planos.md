# Sistema de Planos — TakeZ Plan

## Prompt para o Agente de Execução

---

## 1. Contexto: O que já existe

### Página de assinatura
- **Rota:** `src/app/(dashboard)/settings/subscription/page.tsx`
- **Componente:** `src/components/settings/subscription-section.tsx`
- **Estrutura atual:** 3 planos (Free, Pro, Elite) — manter 3 planos
- **Preços atuais:** em R$ — **converter para USD**

### O que falta (não implementado)
- **Banco de dados:** tabela `profiles` não tem coluna `plan` ou `subscription`
- **Plano atual:** hardcoded como `"free"` em `subscription/page.tsx` (linha 18)
- **Checagem de plano:** nenhuma rota ou feature usa o plano para bloquear acesso
- **Billing:** botões de upgrade não funcionam — sem integração Stripe
- **API:** `economic-calendar` menciona "plano premium" mas não há checagem real

---

## 2. Visão Geral

Implementar o sistema completo de planos **Free**, **Pro** e **Elite** com:
- Preços em **dólar (USD)**
- Toggle **mensal** | **anual**
- Limites de contas por plano
- Sistema de **créditos** para agentes de IA (Pro e Elite)
- **Feature gates** em todas as rotas/actions afetadas
- Garantia de reembolso de 7 dias (sem trial)
- Calendário econômico para **todos**

---

## 3. Preços (USD)

| Plano | Mensal | Anual | Desconto anual |
|-------|--------|-------|----------------|
| **Free** | $0 | $0 | — |
| **Pro** | $14.90/mês | $149/ano | 2 meses grátis (~17%) |
| **Elite** | $24.90/mês | $249/ano | 2 meses grátis (~17%) |

**Anual:** $149/ano (Pro) = ~$12.42/mês | $249/ano (Elite) = ~$20.75/mês

---

## 4. Matriz de Features por Plano

| Feature | Free | Pro | Elite |
|---------|------|-----|-------|
| **Contas vinculadas (MetaApi)** | 0 | 5 ativas por vez | Ilimitadas ativas |
| **Contas manuais (import)** | 1 | Ilimitadas | Ilimitadas |
| **Importações manuais/mês** | 5 | Ilimitadas | Ilimitadas |
| **Dashboard completo** | ✅ | ✅ | ✅ |
| **Day View** | ✅ | ✅ | ✅ |
| **Trade View** | ✅ | ✅ | ✅ |
| **Relatórios avançados** | ❌ | ✅ | ✅ |
| **Takerz Score** | ✅ | ✅ | ✅ |
| **Auto-sync MT4/MT5** | ❌ | ✅ | ✅ |
| **Calendário econômico** | ✅ | ✅ | ✅ |
| **Tags customizadas** | 3 | 50 | Ilimitadas |
| **Agentes de I.A.** | ❌ | ✅ (60 créditos/mês) | ✅ (150 créditos/mês) |
| **Comprar créditos extras** | — | ✅ | ✅ |
| **Exportar PDF** | ❌ | ✅ | ✅ |
| **Acesso à API** | ❌ | ❌ | ✅ |
| **Suporte** | Comunidade | Prioritário | Dedicado |

---

## 5. Regras de Negócio Detalhadas

### 5.1 Contas Free
- **0** contas MetaApi (auto-sync)
- **1** conta criada apenas via import manual
- Ao tentar vincular conta MT4/MT5: CTA para upgrade
- Ao tentar criar 2ª conta: mensagem de limite e CTA para upgrade

### 5.2 Contas Pro — 5 ativas por vez
- Total de contas vinculadas: ilimitado no histórico
- Apenas **5 contas ativas** simultaneamente (`is_active = true`)
- Ao adicionar a 6ª conta ativa:
  - Bloquear ação
  - Mensagem: *"Você atingiu o limite de 5 contas ativas. Remova ou arquive uma conta para adicionar outra."*
- Ao remover ou arquivar uma conta, libera slot para nova conta

### 5.3 Contas Elite
- **Ilimitadas** contas ativas

### 5.4 Sistema de créditos (IA)
- **Pro:** 60 créditos/mês (reset no início de cada ciclo)
- **Elite:** 150 créditos/mês
- Cada análise de agente consome créditos (ex.: 1–5 por análise; definir valor padrão)
- Ao zerar créditos: bloquear novas análises e exibir CTA *"Compre mais créditos"*
- Pacotes de créditos extras (Pro e Elite):
  - 20 créditos — $2.99
  - 50 créditos — $5.99
  - 100 créditos — $9.99

### 5.5 Garantia e trial
- Garantia de reembolso de 7 dias em planos pagos
- Sem trial gratuito

### 5.6 Calendário econômico
- Disponível para Free, Pro e Elite

---

## 6. Implementação Técnica

### 6.1 Banco de dados (Supabase via MCP)

**Opção A — Coluna em `profiles`:**
```sql
ALTER TABLE profiles ADD COLUMN plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite'));
ALTER TABLE profiles ADD COLUMN billing_interval text DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual'));
```

**Opção B — Tabela `subscriptions` (mais flexível):**
```sql
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  billing_interval text DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual')),
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS: usuário só vê/edita própria subscription
```

**Tabela `ai_credits`:**
```sql
CREATE TABLE ai_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining integer DEFAULT 0,
  credits_used_this_period integer DEFAULT 0,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```

**Tabela `credit_purchases`:**
```sql
CREATE TABLE credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_amount integer NOT NULL,
  amount_paid_usd numeric(10,2) NOT NULL,
  stripe_payment_id text,
  created_at timestamptz DEFAULT now()
);
```

### 6.2 Helper `getUserPlan(userId)`

Criar em `src/lib/plan.ts` (ou similar):

```ts
export type Plan = 'free' | 'pro' | 'elite';

export type PlanInfo = {
  plan: Plan;
  billingInterval: 'monthly' | 'annual';
  canUseMetaApi: boolean;
  maxActiveAccounts: number;      // 0 free, 5 pro, unlimited elite
  maxManualAccounts: number;     // 1 free, unlimited pro/elite
  importLimitPerMonth: number;   // 5 free, unlimited pro/elite
  canUseAi: boolean;
  aiCreditsRemaining: number;
  aiCreditsPerMonth: number;     // 0 free, 60 pro, 150 elite
  canUseEconomicCalendar: boolean;  // true para todos
  canExportPdf: boolean;
  maxTags: number;               // 3 free, 50 pro, unlimited elite
  hasApiAccess: boolean;         // false free/pro, true elite
};
```

### 6.3 Contexto de plano / Hook `usePlan()`

- Criar `PlanContext` que lê o plano do backend e expõe para a UI
- Hook `usePlan()` retorna `PlanInfo` + funções de checagem
- Funções auxiliares: `canAccessTradeView()`, `canImportUnlimited()`, `canAddAccount()`, etc.

### 6.4 Gates nas rotas/actions

| Ação | Checagem |
|------|----------|
| Vincular conta MetaApi | `canUseMetaApi` e `maxActiveAccounts` |
| Criar conta manual | `maxManualAccounts` |
| Import manual | `importLimitPerMonth` |
| Agentes de IA | `canUseAi` e `aiCreditsRemaining` |
| Exportar PDF | `canExportPdf` |
| Acesso à API | `hasApiAccess` |
| Calendário econômico | sempre permitido |

### 6.5 UI a atualizar

- **`subscription-section.tsx`:** Atualizar matriz de features, preços em USD, 3 planos (Free, Pro, Elite)
- **Toggle mensal/anual:** Adicionar acima dos cards
- **Mensagens de erro/limite:** Toast ou modal para cada gate (ex.: "Upgrade para Pro para vincular contas")
- **AI Hub:** Exibir créditos restantes (ex.: "42 créditos restantes este mês")
- **Créditos zerados:** Modal ou banner com CTA para comprar créditos

---

## 7. Preços Stripe (sugestão)

- **Pro Mensal:** $14.90/mês
- **Pro Anual:** $149/ano
- **Elite Mensal:** $24.90/mês
- **Elite Anual:** $249/ano
- **Pacotes de créditos:** 20 ($2.99), 50 ($5.99), 100 ($9.99) — one-time

---

## 8. Mensagens sugeridas (i18n)

| Situação | Mensagem |
|----------|----------|
| Vincular conta no Free | "A vinculação direta de contas MT4/MT5 está disponível no plano Pro. Faça upgrade para sincronizar suas contas automaticamente." |
| 6ª conta no Pro | "Você atingiu o limite de 5 contas ativas. Remova ou arquive uma conta para adicionar outra." |
| 2ª conta manual no Free | "O plano Free permite apenas 1 conta. Faça upgrade para Pro para adicionar mais contas." |
| Créditos zerados | "Seus créditos de análise acabaram. Compre mais créditos para continuar usando os agentes de IA." |
| AI no Free | "Os agentes de IA estão disponíveis no plano Pro. Faça upgrade para desbloquear." |

---

## 9. Critérios de Sucesso

- [ ] Usuário Free não consegue vincular conta MetaApi
- [ ] Usuário Free tem no máximo 1 conta manual
- [ ] Usuário Pro com 5 contas ativas não consegue adicionar a 6ª sem remover/arquivar
- [ ] Usuário Elite pode ter contas ilimitadas
- [ ] Pro tem 60 créditos/mês; Elite tem 150 créditos/mês
- [ ] Cada análise de agente consome créditos
- [ ] Créditos zerados bloqueiam novas análises e exibem CTA de compra
- [ ] Calendário econômico funciona para todos os planos
- [ ] Página de assinatura mostra 3 planos com preços em USD e toggle mensal/anual
- [ ] Garantia de 7 dias exibida na página de pricing
- [ ] Tudo responsivo e integrado ao sistema de i18n
- [ ] Coluna `plan` ou tabela `subscriptions` populada corretamente

---

## 10. Ordem sugerida de implementação

1. **Migration:** Adicionar coluna `plan` em `profiles` ou criar tabela `subscriptions`
2. **Helper `getUserPlan()`:** Implementar leitura do plano do backend
3. **Contexto/Hook `usePlan()`:** Expor plano para UI
4. **Atualizar `subscription-section.tsx`:** 3 planos, preços USD, toggle mensal/anual
5. **Feature gates:** Implementar checagens em todas as actions/rotas afetadas
6. **Sistema de créditos:** Tabela `ai_credits`, consumo nas rotas de IA, exibição no AI Hub
7. **Integração Stripe:** Checkout (webhook para atualizar plan)
8. **Comprar créditos:** Produtos e fluxo de pagamento avulso

---

## 11. Perguntas para o agente

1. Prefere coluna `plan` em `profiles` ou tabela separada `subscriptions`? (A tabela é mais flexível para Stripe.)
2. Quantos créditos cada análise de agente deve consumir? (Sugestão: 1–2 por análise simples, 3–5 por análise complexa.)
3. O plano Elite deve ter "contas ilimitadas" realmente sem limite, ou um limite alto (ex.: 50)? (Considerar custo MetaApi.)

---

*Documento gerado para discussão com o agente de execução.*

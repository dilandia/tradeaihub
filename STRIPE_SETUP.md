# Configuração Stripe — TakeZ Plan

Este documento descreve o que **você precisa fazer** para ativar o sistema de planos com Stripe.

---

## 0. Extensão Stripe no Cursor (já configurado)

- **Extensão:** Stripe for VS Code — já instalada
- **Recomendação:** `.vscode/extensions.json` recomenda a extensão ao abrir o projeto
- **Webhooks:** `.vscode/launch.json` tem configs para encaminhar eventos (localhost e VPS)

**Pré-requisito:** Instale o [Stripe CLI](https://docs.stripe.com/stripe-cli/install) para usar webhooks e a extensão.

**Como usar:** `Ctrl+Shift+P` → "Stripe: Forward webhook events" ou use a aba Run (F5) com a config "Stripe: Webhooks → localhost".

---

## 1. Executar a migration no Supabase

**Status:** ✅ Migration já aplicada.

As tabelas `subscriptions`, `ai_credits` e `credit_purchases` já estão criadas no Supabase, além do trigger para novos usuários. Se precisar rodar novamente em outro ambiente, use o SQL Editor com o conteúdo de `supabase/migrations/20250213160000_create_subscriptions_and_credits.sql`.

---

## 2. Criar produtos e preços no Stripe

### Opção A: Script automático (recomendado)

1. Adicione `STRIPE_SECRET_KEY=sk_test_xxx` ao `.env.local` (chave de teste do [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys))
2. Execute:

```bash
node scripts/stripe-setup-products.js
```

O script cria todos os produtos e preços e exibe os Price IDs para você colar no `.env.local`.

### Opção B: Manual no Stripe Dashboard

Acesse [Stripe Dashboard](https://dashboard.stripe.com) → **Products** → **Add product**.

| Produto | Preço mensal | Preço anual |
|---------|--------------|-------------|
| **Pro** | $14.90/mês (recurring, monthly) | $149/ano (recurring, yearly) |
| **Elite** | $24.90/mês (recurring, monthly) | $249/ano (recurring, yearly) |

**Pacotes de créditos (one-time):** 20 ($2.99), 50 ($5.99), 100 ($9.99)

Para cada preço criado, copie o **Price ID** (ex: `price_1ABC123...`).

---

## 3. Variáveis de ambiente

Adicione ao `.env.local`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...   # ou sk_live_... em produção
STRIPE_WEBHOOK_SECRET=whsec_... # obtido ao criar o webhook

# Price IDs (copie do Stripe Dashboard)
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxx
STRIPE_ELITE_MONTHLY_PRICE_ID=price_xxx
STRIPE_ELITE_ANNUAL_PRICE_ID=price_xxx

# Pacotes de créditos (one-time)
STRIPE_CREDITS_20_PRICE_ID=price_xxx
STRIPE_CREDITS_50_PRICE_ID=price_xxx
STRIPE_CREDITS_100_PRICE_ID=price_xxx

# URL da aplicação (para redirect após checkout)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

---

## 4. Configurar o Webhook no Stripe

### Opção A: Script automático (recomendado)

```bash
npm run stripe:webhook -- --write
```

O script cria o webhook via API e adiciona `STRIPE_WEBHOOK_SECRET` ao `.env.local`. Usa `NEXT_PUBLIC_APP_URL` ou fallback `https://116.203.190.102`.

### Opção B: Manual no Dashboard

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. **URL:** `https://seu-dominio.com/api/stripe/webhook`
3. **Eventos a escutar:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copie o **Signing secret** (`whsec_...`) e adicione como `STRIPE_WEBHOOK_SECRET`

### Teste local com Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

O comando exibirá um `whsec_...` temporário — use-o em `STRIPE_WEBHOOK_SECRET` para testes locais.

---

## 5. Garantir subscription para usuários existentes

Se você já tem usuários antes da migration, a migration inclui um `INSERT` que cria `subscriptions` free para todos. Se precisar rodar manualmente:

```sql
INSERT INTO public.subscriptions (user_id, plan, billing_interval, status)
SELECT id, 'free', 'monthly', 'active'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

---

## 6. Checklist final

- [x] Migration executada no Supabase
- [ ] Produtos e preços criados no Stripe
- [ ] Variáveis de ambiente configuradas
- [ ] Webhook configurado no Stripe
- [ ] Teste de checkout em modo teste

---

## Segurança

- **Nunca** exponha `STRIPE_SECRET_KEY` no client
- O webhook valida a assinatura com `STRIPE_WEBHOOK_SECRET`
- Use `sk_test_` em desenvolvimento e `sk_live_` apenas em produção

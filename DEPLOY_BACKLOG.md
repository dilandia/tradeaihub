# Backlog de Deploy — TakeZ Plan

## Deploy 2025-02-13 — Integração Stripe

**Data:** 13/02/2025  
**Ambiente:** VPS 116.203.190.102  
**Destino:** https://116.203.190.102

### Itens incluídos neste deploy

| Item | Descrição |
|------|-----------|
| **Stripe Checkout** | APIs `/api/stripe/checkout` e `/api/stripe/checkout-credits` para assinaturas e créditos |
| **Stripe Webhook** | API `/api/stripe/webhook` para eventos (checkout.session.completed, subscription.*, invoice.*) |
| **Produtos/Preços** | Script `stripe-setup-products.js` — Pro, Elite, pacotes 20/50/100 créditos |
| **Webhook automático** | Script `stripe-setup-webhook.js` — cria webhook via API |
| **Variáveis Stripe** | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, Price IDs, NEXT_PUBLIC_APP_URL |
| **SubscriptionSection** | Correção `locale` em formatDate; toasts success/cancel |
| **i18n** | Chaves plans.upgradeSuccess, plans.checkoutCanceled |
| **Documentação** | STRIPE_SETUP.md, DEPLOY_BACKLOG.md |

### Arquivos alterados/criados

- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/checkout-credits/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/components/settings/subscription-section.tsx`
- `scripts/stripe-setup-products.js`
- `scripts/stripe-setup-webhook.js`
- `scripts/stripe-list-webhooks.js`
- `docs/STRIPE_SETUP.md`
- `docs/DEPLOY_BACKLOG.md`
- `package.json` (scripts stripe:setup, stripe:webhook)

### Variáveis de ambiente no VPS

- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`
- `STRIPE_ELITE_MONTHLY_PRICE_ID`, `STRIPE_ELITE_ANNUAL_PRICE_ID`
- `STRIPE_CREDITS_20_PRICE_ID`, `STRIPE_CREDITS_50_PRICE_ID`, `STRIPE_CREDITS_100_PRICE_ID`

### Webhook Stripe

- URL: `https://116.203.190.102/api/stripe/webhook`
- ID: `we_1T2NqmLa3H9uhiz92xfT1wm5`

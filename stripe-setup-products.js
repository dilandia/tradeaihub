#!/usr/bin/env node
/**
 * Script para criar produtos e preços no Stripe.
 * Execute: node scripts/stripe-setup-products.js
 * Ou: npm run stripe:setup
 *
 * Requer STRIPE_SECRET_KEY no .env.local ou como variável de ambiente.
 * Use chave de TESTE (sk_test_...) para desenvolvimento.
 */

const path = require("path");
const fs = require("fs");

// Carregar .env.local se existir
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const Stripe = require("stripe");

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Erro: STRIPE_SECRET_KEY não encontrada.");
    console.error("Adicione ao .env.local ou rode: STRIPE_SECRET_KEY=sk_test_xxx node scripts/stripe-setup-products.js");
    process.exit(1);
  }

  const stripe = new Stripe(key);
  const isTest = key.startsWith("sk_test_");
  console.log(`Modo: ${isTest ? "TESTE" : "PRODUÇÃO"}\n`);

  const results = { products: {}, prices: {} };

  try {
    // 1. Produto Pro
    const proProduct = await stripe.products.create({
      name: "TakeZ Plan Pro",
      description: "Plano Pro - 5 contas MetaApi, 60 créditos IA/mês, relatórios avançados",
      metadata: { plan: "pro" },
    });
    results.products.pro = proProduct.id;
    console.log("Produto Pro criado:", proProduct.id);

    const proMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1490, // $14.90 em centavos
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan: "pro", interval: "monthly" },
    });
    results.prices.proMonthly = proMonthly.id;

    const proAnnual = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 14900, // $149 em centavos
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan: "pro", interval: "annual" },
    });
    results.prices.proAnnual = proAnnual.id;
    console.log("  Pro Mensal:", proMonthly.id);
    console.log("  Pro Anual:", proAnnual.id);

    // 2. Produto Elite
    const eliteProduct = await stripe.products.create({
      name: "TakeZ Plan Elite",
      description: "Plano Elite - Contas ilimitadas, 150 créditos IA/mês, acesso à API",
      metadata: { plan: "elite" },
    });
    results.products.elite = eliteProduct.id;
    console.log("\nProduto Elite criado:", eliteProduct.id);

    const eliteMonthly = await stripe.prices.create({
      product: eliteProduct.id,
      unit_amount: 2490, // $24.90 em centavos
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan: "elite", interval: "monthly" },
    });
    results.prices.eliteMonthly = eliteMonthly.id;

    const eliteAnnual = await stripe.prices.create({
      product: eliteProduct.id,
      unit_amount: 24900, // $249 em centavos
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan: "elite", interval: "annual" },
    });
    results.prices.eliteAnnual = eliteAnnual.id;
    console.log("  Elite Mensal:", eliteMonthly.id);
    console.log("  Elite Anual:", eliteAnnual.id);

    // 3. Pacotes de créditos (one-time)
    const creditsProduct = await stripe.products.create({
      name: "TakeZ Plan - Créditos IA",
      description: "Pacotes de créditos extras para agentes de IA",
      metadata: { type: "credits" },
    });
    results.products.credits = creditsProduct.id;

    const credits20 = await stripe.prices.create({
      product: creditsProduct.id,
      unit_amount: 299, // $2.99
      currency: "usd",
      metadata: { credits: "20" },
    });
    results.prices.credits20 = credits20.id;

    const credits50 = await stripe.prices.create({
      product: creditsProduct.id,
      unit_amount: 599, // $5.99
      currency: "usd",
      metadata: { credits: "50" },
    });
    results.prices.credits50 = credits50.id;

    const credits100 = await stripe.prices.create({
      product: creditsProduct.id,
      unit_amount: 999, // $9.99
      currency: "usd",
      metadata: { credits: "100" },
    });
    results.prices.credits100 = credits100.id;
    console.log("\nPacotes de créditos criados:");
    console.log("  20 créditos:", credits20.id);
    console.log("  50 créditos:", credits50.id);
    console.log("  100 créditos:", credits100.id);

    // Output para .env.local
    console.log("\n=== Adicione ao .env.local ===\n");
    console.log("# Stripe Price IDs");
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${proMonthly.id}`);
    console.log(`STRIPE_PRO_ANNUAL_PRICE_ID=${proAnnual.id}`);
    console.log(`STRIPE_ELITE_MONTHLY_PRICE_ID=${eliteMonthly.id}`);
    console.log(`STRIPE_ELITE_ANNUAL_PRICE_ID=${eliteAnnual.id}`);
    console.log(`STRIPE_CREDITS_20_PRICE_ID=${credits20.id}`);
    console.log(`STRIPE_CREDITS_50_PRICE_ID=${credits50.id}`);
    console.log(`STRIPE_CREDITS_100_PRICE_ID=${credits100.id}`);
    console.log("\n# Webhook: use 'stripe listen --forward-to localhost:3000/api/stripe/webhook' para obter STRIPE_WEBHOOK_SECRET");
  } catch (err) {
    console.error("Erro:", err.message);
    if (err.code === "resource_already_exists" || err.type === "invalid_request_error") {
      console.error("\nProdutos podem já existir. Verifique no Stripe Dashboard: https://dashboard.stripe.com/products");
    }
    process.exit(1);
  }
}

main();

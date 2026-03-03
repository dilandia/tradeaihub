#!/usr/bin/env node
/**
 * Script para criar Price objects BRL e EUR nos produtos Stripe EXISTENTES.
 * Execute: node scripts/stripe-setup-multi-currency.js
 *
 * NÃO cria produtos novos — adiciona preços aos produtos existentes.
 * Requer STRIPE_SECRET_KEY no .env.local.
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

// Product IDs existentes
const PRODUCTS = {
  pro: "prod_U0Obihpx5sAOqT",
  elite: "prod_U0ObDdFz3zCnBx",
  credits: "prod_U0ObOtPENeQCW5",
};

// Preços BRL (em centavos)
const BRL_PRICES = {
  proMonthly: { product: PRODUCTS.pro, amount: 7990, recurring: { interval: "month" }, metadata: { plan: "pro", interval: "monthly" } },
  proAnnual: { product: PRODUCTS.pro, amount: 76990, recurring: { interval: "year" }, metadata: { plan: "pro", interval: "annual" } },
  eliteMonthly: { product: PRODUCTS.elite, amount: 12990, recurring: { interval: "month" }, metadata: { plan: "elite", interval: "monthly" } },
  eliteAnnual: { product: PRODUCTS.elite, amount: 128990, recurring: { interval: "year" }, metadata: { plan: "elite", interval: "annual" } },
  credits20: { product: PRODUCTS.credits, amount: 1590, metadata: { credits: "20" } },
  credits50: { product: PRODUCTS.credits, amount: 3090, metadata: { credits: "50" } },
  credits100: { product: PRODUCTS.credits, amount: 5190, metadata: { credits: "100" } },
};

// Preços EUR (em cents)
const EUR_PRICES = {
  proMonthly: { product: PRODUCTS.pro, amount: 1290, recurring: { interval: "month" }, metadata: { plan: "pro", interval: "monthly" } },
  proAnnual: { product: PRODUCTS.pro, amount: 12690, recurring: { interval: "year" }, metadata: { plan: "pro", interval: "annual" } },
  eliteMonthly: { product: PRODUCTS.elite, amount: 2190, recurring: { interval: "month" }, metadata: { plan: "elite", interval: "monthly" } },
  eliteAnnual: { product: PRODUCTS.elite, amount: 20990, recurring: { interval: "year" }, metadata: { plan: "elite", interval: "annual" } },
  credits20: { product: PRODUCTS.credits, amount: 290, metadata: { credits: "20" } },
  credits50: { product: PRODUCTS.credits, amount: 499, metadata: { credits: "50" } },
  credits100: { product: PRODUCTS.credits, amount: 890, metadata: { credits: "100" } },
};

async function createPrice(stripe, currency, name, config) {
  const params = {
    product: config.product,
    unit_amount: config.amount,
    currency,
    metadata: config.metadata,
  };
  if (config.recurring) {
    params.recurring = config.recurring;
  }
  const price = await stripe.prices.create(params);
  console.log(`  ${name} (${currency.toUpperCase()}): ${price.id}`);
  return price.id;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Erro: STRIPE_SECRET_KEY nao encontrada.");
    process.exit(1);
  }

  const stripe = new Stripe(key);
  const isTest = key.startsWith("sk_test_");
  console.log(`Modo: ${isTest ? "TESTE" : "PRODUCAO"}\n`);

  const results = {};

  try {
    // Verificar que os produtos existem
    console.log("Verificando produtos existentes...");
    for (const [name, id] of Object.entries(PRODUCTS)) {
      const product = await stripe.products.retrieve(id);
      console.log(`  ${name}: ${product.name} (${product.id})`);
    }
    console.log("");

    // Criar precos BRL
    console.log("Criando precos BRL...");
    results.proMonthlyBrl = await createPrice(stripe, "brl", "Pro Monthly", BRL_PRICES.proMonthly);
    results.proAnnualBrl = await createPrice(stripe, "brl", "Pro Annual", BRL_PRICES.proAnnual);
    results.eliteMonthlyBrl = await createPrice(stripe, "brl", "Elite Monthly", BRL_PRICES.eliteMonthly);
    results.eliteAnnualBrl = await createPrice(stripe, "brl", "Elite Annual", BRL_PRICES.eliteAnnual);
    results.credits20Brl = await createPrice(stripe, "brl", "20 Credits", BRL_PRICES.credits20);
    results.credits50Brl = await createPrice(stripe, "brl", "50 Credits", BRL_PRICES.credits50);
    results.credits100Brl = await createPrice(stripe, "brl", "100 Credits", BRL_PRICES.credits100);
    console.log("");

    // Criar precos EUR
    console.log("Criando precos EUR...");
    results.proMonthlyEur = await createPrice(stripe, "eur", "Pro Monthly", EUR_PRICES.proMonthly);
    results.proAnnualEur = await createPrice(stripe, "eur", "Pro Annual", EUR_PRICES.proAnnual);
    results.eliteMonthlyEur = await createPrice(stripe, "eur", "Elite Monthly", EUR_PRICES.eliteMonthly);
    results.eliteAnnualEur = await createPrice(stripe, "eur", "Elite Annual", EUR_PRICES.eliteAnnual);
    results.credits20Eur = await createPrice(stripe, "eur", "20 Credits", EUR_PRICES.credits20);
    results.credits50Eur = await createPrice(stripe, "eur", "50 Credits", EUR_PRICES.credits50);
    results.credits100Eur = await createPrice(stripe, "eur", "100 Credits", EUR_PRICES.credits100);
    console.log("");

    // Output para .env.local
    console.log("=== Adicione ao .env.local ===\n");
    console.log("# Stripe Multi-Currency Price IDs (BRL)");
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID_BRL=${results.proMonthlyBrl}`);
    console.log(`STRIPE_PRO_ANNUAL_PRICE_ID_BRL=${results.proAnnualBrl}`);
    console.log(`STRIPE_ELITE_MONTHLY_PRICE_ID_BRL=${results.eliteMonthlyBrl}`);
    console.log(`STRIPE_ELITE_ANNUAL_PRICE_ID_BRL=${results.eliteAnnualBrl}`);
    console.log(`STRIPE_CREDITS_20_PRICE_ID_BRL=${results.credits20Brl}`);
    console.log(`STRIPE_CREDITS_50_PRICE_ID_BRL=${results.credits50Brl}`);
    console.log(`STRIPE_CREDITS_100_PRICE_ID_BRL=${results.credits100Brl}`);
    console.log("");
    console.log("# Stripe Multi-Currency Price IDs (EUR)");
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID_EUR=${results.proMonthlyEur}`);
    console.log(`STRIPE_PRO_ANNUAL_PRICE_ID_EUR=${results.proAnnualEur}`);
    console.log(`STRIPE_ELITE_MONTHLY_PRICE_ID_EUR=${results.eliteMonthlyEur}`);
    console.log(`STRIPE_ELITE_ANNUAL_PRICE_ID_EUR=${results.eliteAnnualEur}`);
    console.log(`STRIPE_CREDITS_20_PRICE_ID_EUR=${results.credits20Eur}`);
    console.log(`STRIPE_CREDITS_50_PRICE_ID_EUR=${results.credits50Eur}`);
    console.log(`STRIPE_CREDITS_100_PRICE_ID_EUR=${results.credits100Eur}`);
  } catch (err) {
    console.error("Erro:", err.message);
    if (err.type === "invalid_request_error") {
      console.error("\nVerifique os Product IDs no Stripe Dashboard.");
    }
    process.exit(1);
  }
}

main();

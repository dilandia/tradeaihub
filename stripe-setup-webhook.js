#!/usr/bin/env node
/**
 * Script para criar webhook endpoint no Stripe via API.
 * Execute: node scripts/stripe-setup-webhook.js
 * Ou: npm run stripe:webhook
 *
 * Requer STRIPE_SECRET_KEY no .env.local.
 * Usa NEXT_PUBLIC_APP_URL ou fallback para https://116.203.190.102
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

const EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
];

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Erro: STRIPE_SECRET_KEY não encontrada.");
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://116.203.190.102";
  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/stripe/webhook`;

  const stripe = new Stripe(key);
  const isTest = key.startsWith("sk_test_");
  console.log(`Modo: ${isTest ? "TESTE" : "PRODUÇÃO"}`);
  console.log(`URL do webhook: ${webhookUrl}\n`);

  try {
    // Verificar se já existe webhook com essa URL
    const { data: existing } = await stripe.webhookEndpoints.list({ limit: 100 });
    const found = existing.find((e) => e.url === webhookUrl);
    if (found) {
      console.log("Já existe um webhook com essa URL.");
      console.log("ID:", found.id);
      console.log("\nO secret (whsec_...) só é retornado na criação.");
      console.log("Para obter um novo secret, exclua o webhook no Dashboard e rode este script novamente.");
      console.log("Ou adicione manualmente no Dashboard: https://dashboard.stripe.com/webhooks");
      process.exit(0);
    }

    const endpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: EVENTS,
      description: "TakeZ Plan - assinaturas e créditos IA",
    });

    const secret = endpoint.secret;
    if (!secret) {
      console.error("Webhook criado, mas o secret não foi retornado.");
      console.log("Endpoint ID:", endpoint.id);
      process.exit(1);
    }

    console.log("Webhook criado com sucesso!");
    console.log("ID:", endpoint.id);
    console.log("\n=== Adicione ao .env.local ===\n");
    console.log(`STRIPE_WEBHOOK_SECRET=${secret}`);

    const shouldWrite = process.argv.includes("--write");
    if (shouldWrite) {
      let content = fs.readFileSync(envPath, "utf8");
      const secretLine = `STRIPE_WEBHOOK_SECRET=${secret}`;
      if (content.includes("STRIPE_WEBHOOK_SECRET=")) {
        content = content.replace(/STRIPE_WEBHOOK_SECRET=.*/m, secretLine);
      } else {
        content = content.trimEnd() + "\n" + secretLine + "\n";
      }
      fs.writeFileSync(envPath, content);
      console.log("\n✓ STRIPE_WEBHOOK_SECRET adicionado ao .env.local");
    } else {
      console.log("\nRode com --write para adicionar ao .env.local automaticamente.");
    }
  } catch (err) {
    console.error("Erro ao criar webhook:", err.message);
    if (err.code === "url_invalid") {
      console.error("\nA URL deve ser HTTPS e acessível publicamente.");
    }
    process.exit(1);
  }
}

main();

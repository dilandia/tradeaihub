#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
}
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
stripe.webhookEndpoints.list({ limit: 20 }).then((r) => {
  console.log("Webhooks na conta Stripe:\n");
  r.data.forEach((w) => console.log("  URL:", w.url, "\n  ID:", w.id, "| Status:", w.status, "\n"));
}).catch((e) => console.error("Erro:", e.message));

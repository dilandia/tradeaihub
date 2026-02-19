#!/usr/bin/env node
/**
 * Simula plano Pro para um usuário (por email).
 * Uso: node scripts/simulate-pro-plan.js [email]
 * Ex: node scripts/simulate-pro-plan.js diegorgo@yahoo.com
 */

const path = require("path");
const fs = require("fs");

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
}

const { createClient } = require("@supabase/supabase-js");

async function main() {
  const email = process.argv[2] || "diegorgo@yahoo.com";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY necessários.");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // Buscar user por email (auth.admin)
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("Erro ao listar usuários:", listErr.message);
    process.exit(1);
  }

  const user = users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error("Usuário não encontrado:", email);
    console.log("Usuários disponíveis:", users?.map((u) => u.email).filter(Boolean).slice(0, 5).join(", "));
    process.exit(1);
  }

  const userId = user.id;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Atualizar subscription para Pro
  const { error: subErr } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: "pro",
        billing_interval: "monthly",
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (subErr) {
    console.error("Erro ao atualizar subscription:", subErr.message);
    process.exit(1);
  }

  // Atualizar ai_credits (60 créditos Pro)
  const { error: credErr } = await supabase
    .from("ai_credits")
    .upsert(
      {
        user_id: userId,
        credits_remaining: 60,
        credits_used_this_period: 0,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (credErr) {
    console.error("Erro ao atualizar créditos:", credErr.message);
    process.exit(1);
  }

  console.log("✓ Plano Pro simulado para:", email);
  console.log("  User ID:", userId);
  console.log("  Créditos IA: 60/mês");
  console.log("\nFaça logout e login novamente para ver as mudanças.");
}

main();

/**
 * Script para promover um usuário ao plano PRO no Supabase.
 * Uso: node scripts/upgrade-user-to-pro.mjs <email>
 * Exemplo: node scripts/upgrade-user-to-pro.mjs diegorgo@gmail.com
 *
 * Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Carregar .env.local manualmente
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    console.error("Arquivo .env.local não encontrado.");
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar no .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: node scripts/upgrade-user-to-pro.mjs <email>");
    console.error("Exemplo: node scripts/upgrade-user-to-pro.mjs diegorgo@gmail.com");
    console.error("\nPara listar emails: node scripts/upgrade-user-to-pro.mjs --list");
    process.exit(1);
  }

  // Modo listar usuários
  if (email === "--list") {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      console.error("Erro:", error.message);
      process.exit(1);
    }
    const users = data?.users ?? [];
    console.log("Usuários no Supabase:");
    users.forEach((u) => console.log(`  - ${u.email} (${u.id})`));
    return;
  }

  // 1. Buscar user_id pelo email
  const { data, error: userError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (userError) {
    console.error("Erro ao listar usuários:", userError.message);
    process.exit(1);
  }

  const users = data?.users ?? [];
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`Usuário com email "${email}" não encontrado.`);
    const emails = users.map((u) => u.email).filter(Boolean);
    if (emails.length > 0) {
      console.error("Emails disponíveis:", emails.join(", "));
    }
    process.exit(1);
  }

  const userId = user.id;
  console.log(`Encontrado: ${user.email} (id: ${userId})`);

  // 2. Upsert subscription PRO
  const now = new Date().toISOString();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error: subError } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: "pro",
      status: "active",
      billing_interval: "monthly",
      current_period_start: now,
      current_period_end: periodEnd.toISOString(),
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (subError) {
    console.error("Erro ao atualizar subscription:", subError.message);
    process.exit(1);
  }

  console.log("✓ Subscription atualizada para PRO (active)");

  // 3. Garantir ai_credits (60 créditos Pro)
  const { data: existingCredits } = await supabase
    .from("ai_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  const periodStart = new Date();
  const end = new Date(periodStart);
  end.setMonth(end.getMonth() + 1);

  const creditsPayload = {
    credits_remaining: 60,
    credits_used_this_period: 0,
    period_start: periodStart.toISOString(),
    period_end: end.toISOString(),
    updated_at: now,
  };

  if (!existingCredits) {
    const { error: credError } = await supabase.from("ai_credits").insert({
      user_id: userId,
      ...creditsPayload,
    });
    if (credError) console.error("Erro ao criar ai_credits:", credError.message);
    else console.log("✓ ai_credits criado (60 créditos)");
  } else {
    const { error: credError } = await supabase
      .from("ai_credits")
      .update(creditsPayload)
      .eq("user_id", userId);
    if (credError) console.error("Erro ao atualizar ai_credits:", credError.message);
    else console.log("✓ ai_credits atualizado (60 créditos)");
  }

  console.log("\n✅ Usuário promovido a PRO. Faça logout e login novamente para ver a alteração.");
}

main();

/**
 * Executa a migration onboarding_responses via Management API do Supabase.
 * Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_ACCESS_TOKEN no .env.local
 * Token: https://supabase.com/dashboard/account/tokens
 */
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL || !ACCESS_TOKEN) {
  console.error(
    "Erro: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_ACCESS_TOKEN no .env.local"
  );
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace(/^https:\/\//, "").split(".")[0];
const migrationSql = fs.readFileSync(
  path.join(__dirname, "..", "supabase", "migrations", "20250213100000_create_onboarding_responses.sql"),
  "utf8"
);

async function run() {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: migrationSql }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Erro:", res.status, text);
    process.exit(1);
  }

  console.log("Migration aplicada com sucesso.");
}

run();

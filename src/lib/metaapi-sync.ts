/**
 * MetaApi REST API sync logic.
 * Usa REST diretamente (sem SDK pesado) para:
 * 1. Criar/recuperar conta no MetaApi
 * 2. Deploy → Wait connected → Get deals → Get account info → Undeploy
 * 3. Converter deals para trades do Supabase
 *
 * Roda APENAS server-side.
 */

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto";

/* ─── Constants ─── */

const PROVISIONING_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

/**
 * Retorna a URL base do Client API baseado na região da conta.
 * IMPORTANTE: O Client API usa domínio DIFERENTE do Provisioning API!
 * - Provisioning: mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai
 * - Client:       mt-client-api-v1.{region}.agiliumtrade.ai
 * Docs: https://metaapi.cloud/docs/client/restApi/overview/
 */
function clientBase(region?: string | null): string {
  if (region) {
    return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
  }
  return "https://mt-client-api-v1.agiliumtrade.ai";
}

function getToken(): string {
  const t = process.env.METAAPI_TOKEN;
  if (!t) throw new Error("METAAPI_TOKEN not set");
  return t;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseAdmin(url, key);
}

/* ─── MetaApi REST helpers ─── */

/**
 * Faz requisição HTTP para o MetaApi.
 * Usa node:https nativo para poder desabilitar a verificação de certificado,
 * necessário porque o domínio agiliumtrade.agiliumtrade.ai usa certificados
 * que o Node.js no Windows pode rejeitar.
 */
async function metaFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  // Temporariamente desabilitar verificação SSL para chamadas MetaApi
  const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "auth-token": token,
        ...(options.headers ?? {}),
      },
      cache: "no-store",
    });
    return res;
  } finally {
    // Restaurar configuração original
    if (prevTls === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
    }
  }
}

/** Wrapper com retry automático para erros transientes (429, 5xx) */
async function metaFetchRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  let lastRes: Response | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await metaFetch(url, options);
    lastRes = res;

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "5", 10);
      console.warn(`[metaApi] 429 rate limited, retrying in ${retryAfter}s...`);
      await sleep(retryAfter * 1000);
      continue;
    }

    if (res.status >= 500 && attempt < retries - 1) {
      console.warn(`[metaApi] ${res.status}, retrying in 3s...`);
      await sleep(3000);
      continue;
    }

    return res;
  }

  return lastRes!;
}

type MetaApiAccount = {
  _id?: string;
  id?: string;
  login?: string;
  server?: string;
  state: string;
  connectionStatus?: string;
  region?: string;
  type?: string;
  name?: string;
};

/** Lista contas MetaAPI do usuário (query busca em _id, name, server, login) */
async function listMetaApiAccounts(query?: string): Promise<MetaApiAccount[]> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  const url = `${PROVISIONING_BASE}/users/current/accounts?${params.toString()}`;
  const res = await metaFetchRetry(url);
  if (!res.ok) {
    console.error("[metaApi] listAccounts failed:", res.status);
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data?.items ?? [];
}

/** Cria conta no MetaApi */
async function createMetaApiAccount(params: {
  login: string;
  password: string;
  name: string;
  server: string;
  platform: "mt4" | "mt5";
}): Promise<{ id: string } | { error: string }> {
  const txId = crypto.randomUUID().replace(/-/g, "");

  const body = {
    login: params.login,
    password: params.password,
    name: params.name,
    server: params.server,
    platform: params.platform,
    magic: 0,
    manualTrades: true,
    type: "cloud-g2",
  };

  console.log("[metaApi] Creating account...", {
    login: params.login,
    server: params.server,
    platform: params.platform,
  });

  let res = await metaFetch(`${PROVISIONING_BASE}/users/current/accounts`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "transaction-id": txId },
  });

  // Se 202 (Accepted), precisa retry com mesmo transaction-id
  let retries = 0;
  while (res.status === 202 && retries < 15) {
    const retryAfterSec = parseInt(res.headers.get("Retry-After") || "10", 10);
    const waitMs = Math.min(retryAfterSec * 1000, 30_000);
    console.log(`[metaApi] 202 Accepted, retrying in ${retryAfterSec}s...`);
    await sleep(waitMs);

    res = await metaFetch(`${PROVISIONING_BASE}/users/current/accounts`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "transaction-id": txId },
    });
    retries++;
  }

  if (res.status === 201 || res.status === 200) {
    const data = await res.json();
    console.log("[metaApi] Account created:", data.id);
    return { id: data.id };
  }

  const errBody = await res
    .json()
    .catch(() => ({ message: `HTTP ${res.status}` }));
  console.error("[metaApi] Create error:", errBody);
  return {
    error: errBody.message || `Erro MetaApi ao criar conta (${res.status})`,
  };
}

/** Busca status de uma conta no MetaApi */
async function getMetaApiAccount(
  accountId: string
): Promise<MetaApiAccount | null> {
  const res = await metaFetchRetry(
    `${PROVISIONING_BASE}/users/current/accounts/${accountId}`
  );
  if (!res.ok) {
    console.error("[metaApi] getAccount failed:", res.status);
    return null;
  }
  return res.json();
}

/** Deploy account */
async function deployAccount(accountId: string): Promise<boolean> {
  console.log("[metaApi] Deploying account...", accountId);
  const res = await metaFetchRetry(
    `${PROVISIONING_BASE}/users/current/accounts/${accountId}/deploy`,
    { method: "POST" }
  );
  const ok = res.status === 204 || res.ok;
  if (!ok) {
    console.error("[metaApi] Deploy failed:", res.status);
  }
  return ok;
}

/** Undeploy account (economia de custos) */
async function undeployAccount(accountId: string): Promise<void> {
  console.log("[metaApi] Undeploying account...", accountId);
  await metaFetchRetry(
    `${PROVISIONING_BASE}/users/current/accounts/${accountId}/undeploy`,
    { method: "POST" }
  );
}

/** Espera conta ficar CONNECTED (polls a cada 5s, max 120s) */
async function waitConnected(
  accountId: string,
  timeoutMs = 120_000
): Promise<boolean> {
  const start = Date.now();
  console.log("[metaApi] Waiting for connection...");

  while (Date.now() - start < timeoutMs) {
    const acc = await getMetaApiAccount(accountId);
    if (!acc) return false;

    console.log(
      `[metaApi] state=${acc.state} connectionStatus=${acc.connectionStatus}`
    );

    if (acc.connectionStatus === "CONNECTED") {
      console.log("[metaApi] Connected!");
      return true;
    }

    if (acc.state === "UNDEPLOYED") {
      await deployAccount(accountId);
    }

    await sleep(5_000);
  }

  console.error("[metaApi] Connection timeout after", timeoutMs / 1000, "s");
  return false;
}

/* ─── MetaApi Client API (deals, account info) ─── */

type MetaDeal = {
  id: string;
  orderId?: string;
  positionId?: string;
  symbol: string;
  type: string;
  entryType?: string;
  time: string;
  brokerTime?: string;
  price: number;
  profit: number;
  commission?: number;
  swap?: number;
  volume?: number;
  magic?: number;
  platform?: string;
};

type MetaAccountInfo = {
  balance: number;
  equity: number;
  currency: string;
  leverage: number;
  broker?: string;
};

async function getDeals(
  accountId: string,
  startTime: string,
  endTime: string,
  region?: string | null
): Promise<MetaDeal[]> {
  const base = clientBase(region);
  const allDeals: MetaDeal[] = [];
  let offset = 0;
  const limit = 1000;

  console.log("[metaApi] Fetching deals...", { accountId, startTime, endTime, base });

  while (true) {
    const url = `${base}/users/current/accounts/${accountId}/history-deals/time/${startTime}/${endTime}?offset=${offset}&limit=${limit}`;
    const res = await metaFetchRetry(url);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[metaApi] getDeals status", res.status, body);
      break;
    }

    const deals: MetaDeal[] = await res.json();
    console.log(`[metaApi] Got ${deals.length} deals (offset ${offset})`);
    allDeals.push(...deals);

    if (deals.length < limit) break;
    offset += limit;
  }

  return allDeals;
}

async function getAccountInfo(
  accountId: string,
  region?: string | null
): Promise<MetaAccountInfo | null> {
  const base = clientBase(region);
  const url = `${base}/users/current/accounts/${accountId}/account-information`;
  console.log("[metaApi] Getting account info...", url);

  const res = await metaFetchRetry(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[metaApi] getAccountInfo failed:", res.status, body);
    return null;
  }
  return res.json();
}

/* ─── Deal → Trade conversion ─── */

type TradeInsert = {
  user_id: string;
  trading_account_id: string;
  trade_date: string;
  pair: string;
  entry_price: number;
  exit_price: number;
  pips: number;
  is_win: boolean;
  risk_reward: number | null;
  profit_dollar: number;
  entry_time: string | null;
  exit_time: string | null;
  duration_minutes: number | null;
  ticket: string;
  tags: string[];
  notes: string | null;
};

/**
 * Agrupa deals por positionId para reconstruir trades completos.
 * Um trade = deal ENTRY + deal EXIT com mesmo positionId.
 */
function dealsToTrades(
  deals: MetaDeal[],
  userId: string,
  accountId: string
): TradeInsert[] {
  const positions = new Map<string, MetaDeal[]>();

  for (const d of deals) {
    if (!d.positionId) continue;
    if (d.type === "DEAL_TYPE_BALANCE" || d.type === "DEAL_TYPE_CREDIT") continue;

    const key = d.positionId;
    const group = positions.get(key) ?? [];
    group.push(d);
    positions.set(key, group);
  }

  const trades: TradeInsert[] = [];

  for (const [posId, group] of positions) {
    const entries = group.filter(
      (d) =>
        d.entryType === "DEAL_ENTRY_IN" ||
        d.type === "DEAL_TYPE_BUY" ||
        d.type === "DEAL_TYPE_SELL"
    );
    const exits = group.filter(
      (d) =>
        d.entryType === "DEAL_ENTRY_OUT" ||
        d.entryType === "DEAL_ENTRY_INOUT" ||
        d.entryType === "DEAL_ENTRY_OUT_BY"
    );

    const entry = entries[0];
    const exit = exits[0] ?? entries[entries.length - 1];

    if (!entry) continue;

    const entryTime = new Date(entry.time);
    const exitTime = exit ? new Date(exit.time) : null;

    const totalProfit = group.reduce(
      (s, d) => s + (d.profit ?? 0) + (d.swap ?? 0) + (d.commission ?? 0),
      0
    );

    const entryPrice = entry.price;
    const exitPrice = exit?.price ?? entryPrice;
    const symbol = entry.symbol;

    const sym = symbol.toUpperCase().replace(/\.c$/i, "");
    const isGold = /XAU|GOLD/i.test(sym);
    const isSilver = /XAG|SILVER/i.test(sym);
    const isJpy = sym.includes("JPY");
    const pipMultiplier = (isGold || isSilver || isJpy) ? 100 : 10000;
    const rawPips =
      entry.type === "DEAL_TYPE_BUY"
        ? (exitPrice - entryPrice) * pipMultiplier
        : (entryPrice - exitPrice) * pipMultiplier;

    const pips = Math.round(rawPips * 10) / 10;
    const isWin = totalProfit > 0;

    let durationMinutes: number | null = null;
    if (exitTime) {
      durationMinutes =
        Math.round(
          ((exitTime.getTime() - entryTime.getTime()) / 60_000) * 10
        ) / 10;
    }

    const tradeDate = entryTime.toISOString().slice(0, 10);
    const entryTimeStr = entryTime.toISOString().slice(11, 19);
    const exitTimeStr = exitTime ? exitTime.toISOString().slice(11, 19) : null;

    trades.push({
      user_id: userId,
      trading_account_id: accountId,
      trade_date: tradeDate,
      pair: symbol,
      entry_price: entryPrice,
      exit_price: exitPrice,
      pips,
      is_win: isWin,
      risk_reward: null,
      profit_dollar: Math.round(totalProfit * 100) / 100,
      entry_time: entryTimeStr,
      exit_time: exitTimeStr,
      duration_minutes: durationMinutes,
      ticket: posId,
      tags: [],
      notes: null,
    });
  }

  console.log(`[metaApi] Converted ${trades.length} trades from ${deals.length} deals`);
  return trades;
}

/* ─── Main sync function ─── */

export type SyncResult = {
  success: boolean;
  tradesImported?: number;
  balance?: number;
  equity?: number;
  error?: string;
};

export async function syncAccountWithMetaApi(
  tradingAccountId: string,
  userId: string
): Promise<SyncResult> {
  const sb = adminClient();

  try {
    // 1) Buscar conta no DB
    const { data: account, error: accErr } = await sb
      .from("trading_accounts")
      .select("*")
      .eq("id", tradingAccountId)
      .eq("user_id", userId)
      .single();

    if (accErr || !account) {
      return { success: false, error: "Conta não encontrada." };
    }

    console.log("[sync] Starting sync for:", account.account_name, account.login);

    // 2) Descriptografar senha
    let password: string;
    try {
      password = decrypt(account.password_encrypted);
    } catch {
      return { success: false, error: "Erro ao descriptografar senha." };
    }

    // 3) Criar ou recuperar conta no MetaApi (evitar criar duplicata = cobrança extra)
    let metaApiId = account.metaapi_account_id;

    if (!metaApiId) {
      // Buscar conta existente no MetaAPI (login+server) antes de criar
      const existing = await listMetaApiAccounts(account.login);
      const match = existing.find(
        (a) =>
          String(a.login) === String(account.login) &&
          (a.server ?? "").toLowerCase() === (account.server ?? "").toLowerCase()
      );

      if (match) {
        metaApiId = match._id ?? match.id ?? "";
        console.log("[metaApi] Reusing existing account:", metaApiId);
      }

      if (!metaApiId) {
        const createResult = await createMetaApiAccount({
          login: account.login,
          password,
          name: account.account_name,
          server: account.server,
          platform: account.platform.toLowerCase() as "mt4" | "mt5",
        });

        if ("error" in createResult) {
          return { success: false, error: createResult.error };
        }

        metaApiId = createResult.id;
      }

      await sb
        .from("trading_accounts")
        .update({ metaapi_account_id: metaApiId })
        .eq("id", tradingAccountId);
    }

    // 4) Obter detalhes da conta (para saber a região)
    const metaAccount = await getMetaApiAccount(metaApiId!);
    const region = metaAccount?.region ?? null;
    console.log("[sync] MetaApi account region:", region, "state:", metaAccount?.state);

    // 5) Deploy (se não estiver já deployed)
    if (metaAccount?.state !== "DEPLOYED") {
      const deployed = await deployAccount(metaApiId!);
      if (!deployed) {
        return { success: false, error: "Falha ao fazer deploy da conta no MetaApi." };
      }
    }

    // 6) Wait connected
    const connected = await waitConnected(metaApiId!, 150_000);
    if (!connected) {
      // Não fazer undeploy aqui — deixar deployada para tentar novamente
      return {
        success: false,
        error: "Timeout: conta não conectou em 2.5 minutos. Tente novamente em alguns instantes.",
      };
    }

    // 6.5) Aguardar sincronização do terminal state
    // MetaApi precisa de tempo para sincronizar o histórico do broker
    // Especialmente para contas novas com muito histórico
    console.log("[sync] Waiting 10s for terminal history to sync...");
    await sleep(10_000);

    // 7) Get account info (usa URL regional) — com retry
    let accInfo = await getAccountInfo(metaApiId!, region);
    if (!accInfo) {
      console.log("[sync] accountInfo failed, retrying in 10s...");
      await sleep(10_000);
      accInfo = await getAccountInfo(metaApiId!, region);
    }
    if (accInfo) {
      console.log("[sync] Account info OK:", {
        balance: accInfo.balance,
        equity: accInfo.equity,
        currency: accInfo.currency,
      });
    }

    // 8) Get deals (usa URL regional)
    // Se last_sync_at existe E já temos trades, buscar só novos.
    // Caso contrário, buscar histórico completo (2 anos).
    const { count: existingTradeCount } = await sb
      .from("trades")
      .select("id", { count: "exact", head: true })
      .eq("trading_account_id", tradingAccountId)
      .eq("user_id", userId);

    const hasExistingTrades = (existingTradeCount ?? 0) > 0;
    const startTime =
      account.last_sync_at && hasExistingTrades
        ? new Date(account.last_sync_at).toISOString()
        : new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 2 anos
    const endTime = new Date().toISOString();

    console.log("[sync] Fetching deals from", startTime, "to", endTime, hasExistingTrades ? "(incremental)" : "(full history)");

    let deals = await getDeals(metaApiId!, startTime, endTime, region);

    // Se retornou 0 deals na primeira tentativa (história pode não estar sincronizada),
    // aguardar mais e tentar novamente
    if (deals.length === 0 && !hasExistingTrades) {
      console.log("[sync] 0 deals on first attempt. Waiting 15s for history sync...");
      await sleep(15_000);
      deals = await getDeals(metaApiId!, startTime, endTime, region);
    }

    // 9) Convert deals to trades
    const newTrades = dealsToTrades(deals, userId, tradingAccountId);

    // 10) Upsert trades (usar ticket como chave única)
    let imported = 0;
    if (newTrades.length > 0) {
      const { data: existing } = await sb
        .from("trades")
        .select("ticket")
        .eq("trading_account_id", tradingAccountId)
        .eq("user_id", userId);

      const existingTickets = new Set(
        (existing ?? []).map((t: { ticket: string }) => t.ticket)
      );

      const toInsert = newTrades.filter(
        (t) => !existingTickets.has(t.ticket)
      );

      if (toInsert.length > 0) {
        for (let i = 0; i < toInsert.length; i += 100) {
          const batch = toInsert.slice(i, i + 100);
          const { error: insertErr } = await sb.from("trades").insert(batch);
          if (insertErr) {
            console.error("[sync] Insert error:", insertErr.message);
          }
        }
        imported = toInsert.length;
      }
    }

    console.log("[sync] Trades imported:", imported);

    // 11) Atualizar conta no DB
    // IMPORTANTE: Só atualizar last_sync_at se realmente importou trades
    // OU se já existiam trades (incremental sync legítimo com 0 novos)
    const now = new Date().toISOString();
    const shouldUpdateSyncTime = imported > 0 || hasExistingTrades;

    await sb
      .from("trading_accounts")
      .update({
        status: "connected",
        last_sync_at: shouldUpdateSyncTime ? now : null,
        balance: accInfo?.balance ?? account.balance,
        equity: accInfo?.equity ?? account.equity,
        currency: accInfo?.currency ?? account.currency,
        leverage: accInfo?.leverage ?? account.leverage,
        error_message: imported === 0 && !hasExistingTrades
          ? "Sync OK mas 0 deals encontrados. Verifique se há histórico na conta."
          : null,
        updated_at: now,
      })
      .eq("id", tradingAccountId);

    // 12) Undeploy (economia de custo)
    await undeployAccount(metaApiId!);

    return {
      success: true,
      tradesImported: imported,
      balance: accInfo?.balance ?? Number(account.balance),
      equity: accInfo?.equity ?? Number(account.equity),
    };
  } catch (err) {
    console.error("[syncAccountWithMetaApi] Error:", err);
    const message =
      err instanceof Error ? err.message : "Erro inesperado na sincronização.";
    return { success: false, error: message };
  }
}

/* ─── Utils ─── */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

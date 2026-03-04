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
import { syncLogger } from "@/lib/logger";

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

/** Base URL da MetaStats API (usa mesma região do Client). */
function metastatsBase(region?: string | null): string {
  if (region) {
    return `https://metastats-api-v1.${region}.agiliumtrade.ai`;
  }
  return "https://metastats-api-v1.new-york.agiliumtrade.ai";
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
      const rawRetry = parseInt(res.headers.get("Retry-After") || "5", 10);
      const retryAfter = Number.isNaN(rawRetry) || rawRetry <= 0 ? 5 : rawRetry;
      syncLogger.warn({ status: 429, retryAfter }, "Rate limited, retrying");
      await sleep(retryAfter * 1000);
      continue;
    }

    if (res.status >= 500 && attempt < retries - 1) {
      syncLogger.warn({ status: res.status }, "Server error, retrying in 3s");
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
  metastatsApiEnabled?: boolean;
};

/** Lista contas MetaAPI do usuário (query busca em _id, name, server, login) */
async function listMetaApiAccounts(query?: string): Promise<MetaApiAccount[]> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  const url = `${PROVISIONING_BASE}/users/current/accounts?${params.toString()}`;
  const res = await metaFetchRetry(url);
  if (!res.ok) {
    syncLogger.error({ status: res.status }, "listAccounts failed");
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

  syncLogger.debug("Creating MetaApi account");

  let res = await metaFetch(`${PROVISIONING_BASE}/users/current/accounts`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "transaction-id": txId },
  });

  // Se 202 (Accepted), precisa retry com mesmo transaction-id
  let retries = 0;
  while (res.status === 202 && retries < 15) {
    const raw = parseInt(res.headers.get("Retry-After") || "10", 10);
    const retryAfterSec = Number.isNaN(raw) || raw <= 0 ? 10 : raw;
    const waitMs = Math.min(retryAfterSec * 1000, 30_000);
    syncLogger.info({ retryAfterSec }, "202 Accepted, retrying");
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
    syncLogger.info({ accountId: data.id }, "Account created");

    // Enable MetaStats API on the new account (required for metrics endpoint)
    try {
      const enableRes = await metaFetch(
        `${PROVISIONING_BASE}/users/current/accounts/${data.id}/enable-metastats-api`,
        { method: "POST" }
      );
      if (enableRes.status === 204 || enableRes.status === 200) {
        syncLogger.info({ accountId: data.id }, "MetaStats API enabled");
      } else {
        syncLogger.warn({ status: enableRes.status }, "Failed to enable MetaStats");
      }
    } catch (err) {
      syncLogger.warn({ error: err }, "MetaStats enable failed (non-blocking)");
    }

    return { id: data.id };
  }

  const errBody = await res
    .json()
    .catch(() => ({ message: `HTTP ${res.status}` }));
  syncLogger.error({ status: res.status, message: errBody.message }, "Account create error");
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
    syncLogger.error({ status: res.status }, "getAccount failed");
    return null;
  }
  return res.json();
}

/** Deploy account */
async function deployAccount(accountId: string): Promise<boolean> {
  syncLogger.debug("Deploying account");
  const res = await metaFetchRetry(
    `${PROVISIONING_BASE}/users/current/accounts/${accountId}/deploy`,
    { method: "POST" }
  );
  const ok = res.status === 204 || res.ok;
  if (!ok) {
    syncLogger.error({ status: res.status }, "Deploy failed");
  }
  return ok;
}

/** Undeploy account (economia de custos) */
export async function undeployAccount(accountId: string): Promise<void> {
  syncLogger.debug("Undeploying account");
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
  syncLogger.info({ accountId }, "Waiting for connection");

  while (Date.now() - start < timeoutMs) {
    const acc = await getMetaApiAccount(accountId);
    if (!acc) return false;

    syncLogger.debug({ state: acc.state, connectionStatus: acc.connectionStatus }, "Connection poll");

    if (acc.connectionStatus === "CONNECTED") {
      syncLogger.info({ accountId }, "Connected");
      return true;
    }

    if (acc.state === "UNDEPLOYED") {
      await deployAccount(accountId);
    }

    await sleep(5_000);
  }

  syncLogger.error({ timeoutSec: timeoutMs / 1000 }, "Connection timeout");
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
  // Campo alternativo que alguns brokers retornam
  commissionAmount?: number;
};

/** Converte valor para número. API pode retornar string ou undefined. */
function toNum(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

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

  syncLogger.debug({ accountId }, "Fetching deals");

  while (true) {
    const url = `${base}/users/current/accounts/${accountId}/history-deals/time/${startTime}/${endTime}?offset=${offset}&limit=${limit}`;
    const res = await metaFetchRetry(url);

    if (!res.ok) {
      syncLogger.error({ status: res.status }, "getDeals failed");
      break;
    }

    const deals: MetaDeal[] = await res.json();
    syncLogger.info({ count: deals.length, offset }, "Fetched deals batch");
    allDeals.push(...deals);

    if (deals.length < limit) break;
    offset += limit;
  }

  return allDeals;
}

/** Busca deals de uma posição específica (fallback quando time-range retorna dados incompletos). */
async function getDealsByPosition(
  accountId: string,
  positionId: string,
  region?: string | null
): Promise<MetaDeal[]> {
  const base = clientBase(region);
  const url = `${base}/users/current/accounts/${accountId}/history-deals/position/${positionId}`;
  const res = await metaFetchRetry(url);
  if (!res.ok) return [];
  const deals: MetaDeal[] = await res.json();
  return Array.isArray(deals) ? deals : [];
}

type MetaStatsTrade = {
  positionId: string;
  profit: number;
  pips?: number;
  success?: "won" | "lost";
  openTime?: string;
  closeTime?: string;
  openPrice?: number;
  closePrice?: number;
  symbol?: string;
  durationInMinutes?: number;
};

/**
 * Busca trades históricos via MetaStats API.
 * Usado como fallback quando deals retornam P&L zerado — MetaStats agrega os dados do broker.
 * Docs: https://metaapi.cloud/docs/metastats/restApi/api/getHistoricalTrades/
 */
async function getMetaStatsHistoricalTrades(
  accountId: string,
  startTime: string,
  endTime: string,
  region?: string | null
): Promise<MetaStatsTrade[]> {
  const base = metastatsBase(region);
  // MetaStats usa formato broker: YYYY-MM-DD HH:mm:ss.SSS (UTC)
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toISOString().replace("T", " ").slice(0, 23);
  };
  const start = encodeURIComponent(fmt(startTime));
  const end = encodeURIComponent(fmt(endTime));
  const url = `${base}/users/current/accounts/${accountId}/historical-trades/${start}/${end}?updateHistory=true`;
  const res = await metaFetchRetry(url);

  if (res.status === 403) {
    syncLogger.info({ accountId }, "MetaStats not enabled for account (403)");
    return [];
  }
  if (res.status === 202) {
    const rawMs = parseInt(res.headers.get("retry-after") || "5", 10);
    const retryAfter = Number.isNaN(rawMs) || rawMs <= 0 ? 5 : rawMs;
    syncLogger.info({ retryAfter }, "MetaStats processing, retrying");
    await sleep(retryAfter * 1000);
    return getMetaStatsHistoricalTrades(accountId, startTime, endTime, region);
  }
  if (!res.ok) return [];

  const data = await res.json();
  const trades = data?.trades ?? [];
  return Array.isArray(trades) ? trades : [];
}

async function getAccountInfo(
  accountId: string,
  region?: string | null
): Promise<MetaAccountInfo | null> {
  const base = clientBase(region);
  const url = `${base}/users/current/accounts/${accountId}/account-information`;

  const res = await metaFetchRetry(url);
  if (!res.ok) {
    syncLogger.error({ status: res.status }, "getAccountInfo failed");
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
  source: string;
};

/**
 * Extrai profit líquido de um deal (profit + swap + commission).
 * Suporta valores string vindos da API e campos alternativos (commissionAmount).
 */
function dealProfit(d: MetaDeal): number {
  const profit = toNum(d.profit);
  const swap = toNum(d.swap);
  const commission =
    toNum(d.commission) ||
    toNum((d as Record<string, unknown>).commissionAmount);
  return profit + swap + commission;
}

/**
 * Agrupa deals por positionId (ou orderId para MT4) para reconstruir trades completos.
 * Um trade = deal ENTRY + deal EXIT com mesmo positionId.
 */
function dealsToTrades(
  deals: MetaDeal[],
  userId: string,
  accountId: string
): TradeInsert[] {
  const positions = new Map<string, MetaDeal[]>();

  for (const d of deals) {
    if (d.type === "DEAL_TYPE_BALANCE" || d.type === "DEAL_TYPE_CREDIT") continue;

    // MT5: positionId; MT4: pode vir vazio — usar orderId como fallback
    const key =
      (d.positionId && String(d.positionId).trim()) ||
      (d.orderId && String(d.orderId).trim()) ||
      "";
    if (!key) continue;

    const group = positions.get(key) ?? [];
    group.push(d);
    positions.set(key, group);
  }

  const trades: TradeInsert[] = [];

  const byTime = (a: MetaDeal, b: MetaDeal) =>
    new Date(a.time).getTime() - new Date(b.time).getTime();

  for (const [posId, group] of positions) {
    const entries = group
      .filter(
        (d) =>
          d.entryType === "DEAL_ENTRY_IN" ||
          d.type === "DEAL_TYPE_BUY" ||
          d.type === "DEAL_TYPE_SELL"
      )
      .sort(byTime);
    const exits = group
      .filter(
        (d) =>
          d.entryType === "DEAL_ENTRY_OUT" ||
          d.entryType === "DEAL_ENTRY_INOUT" ||
          d.entryType === "DEAL_ENTRY_OUT_BY"
      )
      .sort(byTime);

    const entry = entries[0];
    const exit = exits.length > 0 ? exits[exits.length - 1] : entries[entries.length - 1];

    if (!entry) continue;

    const entryTime = new Date(entry.time);
    const exitTime = exit ? new Date(exit.time) : null;

    const totalProfit = group.reduce((s, d) => s + dealProfit(d), 0);

    // Log para debug quando trade tem P&L zerado mas há deals (possível problema de sync)
    if (totalProfit === 0 && group.length > 0) {
      syncLogger.warn({ dealCount: group.length, positionId: posId }, "Trade with zero P&L");
    }

    const entryPrice = entry.price;
    const exitPrice = exit?.price ?? entryPrice;
    const symbol = entry.symbol;

    // RC8: Normalize pair — strip broker suffixes (.c, .ecn, .pro), separators, uppercase
    const normalizedPair = symbol
      .replace(/\.[a-z]+$/i, "")
      .replace(/[_\-\s]/g, "")
      .trim()
      .toUpperCase();
    const isGold = /XAU|GOLD/i.test(normalizedPair);
    const isSilver = /XAG|SILVER/i.test(normalizedPair);
    const isJpy = normalizedPair.includes("JPY");
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
      pair: normalizedPair,
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
      source: "sync",
    });
  }

  syncLogger.info({ tradesCount: trades.length, dealsCount: deals.length }, "Converted deals to trades");
  return trades;
}

/** Extract key metrics from full MetaStats response for fast access */
function extractMetricsSummary(metrics: Record<string, unknown>): Record<string, unknown> {
  return {
    // Performance
    gain: metrics.gain ?? null,
    absoluteGain: metrics.absoluteGain ?? null,
    dailyGain: metrics.dailyGain ?? null,
    monthlyGain: metrics.monthlyGain ?? null,
    profitFactor: metrics.profitFactor ?? null,
    expectancy: metrics.expectancy ?? null,
    expectancyPips: metrics.expectancyPips ?? null,

    // Risk-adjusted returns
    sortinoRatio: metrics.sortinoRatio ?? null,
    sharpeRatio: metrics.sharpeRatio ?? null,
    standardDeviationProfit: metrics.standardDeviationProfit ?? null,
    kurtosisProfit: metrics.kurtosisProfit ?? null,
    zScore: metrics.zScore ?? null,

    // Growth
    cagr: metrics.cagr ?? null,
    mar: metrics.mar ?? null,

    // Trades
    trades: metrics.trades ?? null,
    wonTradesPercent: metrics.wonTradesPercent ?? null,
    lostTradesPercent: metrics.lostTradesPercent ?? null,
    longTrades: metrics.longTrades ?? null,
    shortTrades: metrics.shortTrades ?? null,
    longWonTradesPercent: metrics.longWonTradesPercent ?? null,
    shortWonTradesPercent: metrics.shortWonTradesPercent ?? null,

    // Extremes
    bestTrade: metrics.bestTrade ?? null,
    bestTradeDate: metrics.bestTradeDate ?? null,
    worstTrade: metrics.worstTrade ?? null,
    worstTradeDate: metrics.worstTradeDate ?? null,
    averageWin: metrics.averageWin ?? null,
    averageLoss: metrics.averageLoss ?? null,

    // Volume & duration
    lots: metrics.lots ?? null,
    averageTradeLengthInMilliseconds: metrics.averageTradeLengthInMilliseconds ?? null,

    // Balance
    highestBalance: metrics.highestBalance ?? null,
    highestBalanceDate: metrics.highestBalanceDate ?? null,
    maxDrawdown: metrics.maxDrawdown ?? null,

    // Risk of ruin (keep first 5 entries)
    riskOfRuin: Array.isArray(metrics.riskOfRuin)
      ? (metrics.riskOfRuin as unknown[]).slice(0, 5)
      : null,

    // Aggregated data for report widgets
    currencySummary: metrics.currencySummary ?? null,
    closeTradesByWeekDay: metrics.closeTradesByWeekDay ?? null,
    openTradesByHour: metrics.openTradesByHour ?? null,

    // Metadata
    _fetchedAt: new Date().toISOString(),
  };
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

  // Declare metaApiId outside try so it's accessible in catch for cleanup
  let metaApiId: string | null = null;

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

    syncLogger.debug({ tradingAccountId }, "Starting sync");

    // 2) Descriptografar senha
    let password: string;
    try {
      password = decrypt(account.password_encrypted);
    } catch {
      return { success: false, error: "Erro ao descriptografar senha." };
    }

    // 3) Criar ou recuperar conta no MetaApi (evitar criar duplicata = cobrança extra)
    metaApiId = account.metaapi_account_id;

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
        syncLogger.debug({ metaApiId }, "Reusing existing MetaApi account");
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

    // 4.5) Ensure MetaStats API is enabled (required for metrics endpoint)
    if (metaAccount && !metaAccount.metastatsApiEnabled) {
      try {
        const enableRes = await metaFetch(
          `${PROVISIONING_BASE}/users/current/accounts/${metaApiId}/enable-metastats-api`,
          { method: "POST" }
        );
        if (enableRes.status === 204 || enableRes.status === 200) {
          syncLogger.info({ metaApiId }, "MetaStats API enabled for account");
        }
      } catch {
        // Non-blocking
      }
    }

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
    syncLogger.info("Waiting 10s for terminal history to sync");
    await sleep(10_000);

    // 7) Get account info (usa URL regional) — com retry
    let accInfo = await getAccountInfo(metaApiId!, region);
    if (!accInfo) {
      syncLogger.info("accountInfo failed, retrying in 10s");
      await sleep(10_000);
      accInfo = await getAccountInfo(metaApiId!, region);
    }
    if (accInfo) {
      syncLogger.debug("Account info OK");
    }

    // 8) Get deals (usa URL regional)
    // Se last_sync_at existe E já temos trades, buscar só novos.
    // Caso contrário, buscar histórico completo (2 anos).
    const { data: existingTradesData } = await sb
      .from("trades")
      .select("id, ticket, trade_date, profit_dollar")
      .eq("trading_account_id", tradingAccountId)
      .eq("user_id", userId);

    const hasExistingTrades = (existingTradesData ?? []).length > 0;
    const zeroProfitInDb = (existingTradesData ?? []).filter(
      (t: { profit_dollar: number }) => t.profit_dollar === 0
    );

    let startTime: string;
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const lastSync = account.last_sync_at
      ? new Date(account.last_sync_at).toISOString()
      : null;

    if (zeroProfitInDb.length > 0) {
      // CRÍTICO: trades zerados no DB — expandir range para re-buscar da API
      // O incremental (last_sync_at) exclui trades antigos; precisamos incluir as datas deles
      const minDate = zeroProfitInDb.reduce(
        (a: string, t: { trade_date: string }) =>
          (t.trade_date < a ? t.trade_date : a),
        (zeroProfitInDb[0] as { trade_date: string }).trade_date
      );
      const expandedStart = new Date(minDate + "T00:00:00.000Z");
      expandedStart.setDate(expandedStart.getDate() - 1); // 1 dia antes
      startTime = expandedStart.toISOString();
      syncLogger.info({ zeroProfitCount: zeroProfitInDb.length, minDate, startTime }, "Expanding range to re-fetch zero-profit trades");
    } else if (lastSync && hasExistingTrades) {
      startTime = lastSync;
    } else {
      startTime = twoYearsAgo;
    }

    // endTime exclusivo na API — adicionar 2 min para capturar deals recentes
    const endTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    syncLogger.info({ startTime, endTime, mode: hasExistingTrades ? "incremental" : "full_history" }, "Fetching deals");

    let deals = await getDeals(metaApiId!, startTime, endTime, region);

    // Se retornou 0 deals na primeira tentativa (história pode não estar sincronizada),
    // aguardar mais e tentar novamente
    if (deals.length === 0 && !hasExistingTrades) {
      syncLogger.info("0 deals on first attempt, waiting 15s for history sync");
      await sleep(15_000);
      deals = await getDeals(metaApiId!, startTime, endTime, region);
    }

    // 8.4) Fallback: quando há trades zerados no DB e time-range retornou 0 deals,
    // buscar por positionId (ticket) — ignora o filtro de tempo da API
    if (deals.length === 0 && zeroProfitInDb.length > 0) {
      syncLogger.info({ zeroProfitCount: zeroProfitInDb.length }, "0 deals in range, fetching by positionId");
      const seen = new Set<string>();
      for (const row of zeroProfitInDb.slice(0, 20) as { ticket: string }[]) {
        const ticket = row.ticket?.trim();
        if (!ticket || seen.has(ticket)) continue;
        seen.add(ticket);
        const posDeals = await getDealsByPosition(metaApiId!, ticket, region);
        for (const d of posDeals) {
          if (!deals.some((x) => x.id === d.id)) {
            deals.push(d);
          }
        }
      }
      syncLogger.info({ count: deals.length }, "getDealsByPosition returned deals");
    }

    // 8.5) Enriquecer deals: para posições com P&L zerado, buscar por position (API pode retornar dados incompletos)
    const byPos = new Map<string, MetaDeal[]>();
    for (const d of deals) {
      const key =
        (d.positionId && String(d.positionId).trim()) ||
        (d.orderId && String(d.orderId).trim()) ||
        "";
      if (!key) continue;
      const g = byPos.get(key) ?? [];
      g.push(d);
      byPos.set(key, g);
    }
    const zeroProfitPositions: string[] = [];
    for (const [posId, group] of byPos) {
      const total = group.reduce((s, d) => s + dealProfit(d), 0);
      if (total === 0 && group.length > 0) zeroProfitPositions.push(posId);
    }
    if (zeroProfitPositions.length > 0) {
      syncLogger.info({ count: zeroProfitPositions.length }, "Enriching zero-profit positions via getDealsByPosition");
      const seen = new Set(deals.map((d) => d.id));
      for (const posId of zeroProfitPositions.slice(0, 20)) {
        const extra = await getDealsByPosition(metaApiId!, posId, region);
        for (const d of extra) {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            deals.push(d);
          }
        }
      }
    }

    // 9) Convert deals to trades
    let newTrades = dealsToTrades(deals, userId, tradingAccountId);

    // 9.5) Fallback MetaStats: quando há trades com P&L zerado, buscar via MetaStats (dados agregados do broker)
    const zeroProfitTrades = newTrades.filter((t) => t.profit_dollar === 0);
    if (zeroProfitTrades.length > 0) {
      syncLogger.info({ count: zeroProfitTrades.length }, "Fallback MetaStats for zero-profit trades");
      const metaStatsTrades = await getMetaStatsHistoricalTrades(
        metaApiId!,
        startTime,
        endTime,
        region
      );
      const msByPos = new Map(metaStatsTrades.map((t) => [t.positionId, t]));
      newTrades = newTrades.map((t) => {
        if (t.profit_dollar !== 0) return t;
        const ms = msByPos.get(t.ticket);
        if (!ms || ms.profit === 0) return t;
        const profit = toNum(ms.profit);
        const pips = ms.pips != null ? toNum(ms.pips) : t.pips;
        const isWin = ms.success === "won" || profit > 0;
        syncLogger.debug({ ticket: t.ticket }, "MetaStats corrected trade");
        return {
          ...t,
          profit_dollar: Math.round(profit * 100) / 100,
          pips,
          is_win: isWin,
          exit_price: ms.closePrice ?? t.exit_price,
          exit_time: ms.closeTime ? ms.closeTime.slice(11, 19) : t.exit_time,
          duration_minutes: ms.durationInMinutes ?? t.duration_minutes,
        };
      });
    }

    // 9.8) Phase 2: Cross-source dedup — when sync finds matching import trades, UPDATE them
    try {
      const { data: importTrades } = await sb
        .from("trades")
        .select("id, pair, trade_date, entry_price, exit_price, profit_dollar, ticket, source")
        .eq("user_id", userId)
        .eq("source", "import")
        .is("deleted_at", null);

      if (importTrades && importTrades.length > 0 && newTrades.length > 0) {
        const importByComposite = new Map<string, { id: string; ticket: string | null }>();
        for (const it of importTrades) {
          const normPair = (it.pair ?? "").replace(/\.[a-z]+$/i, "").replace(/[_\-\s]/g, "").toUpperCase();
          const key = `${normPair}|${it.trade_date}|${it.entry_price}|${it.exit_price}`;
          importByComposite.set(key, { id: it.id, ticket: it.ticket });
        }

        const importByTicket = new Map<string, string>();
        for (const it of importTrades) {
          if (it.ticket) importByTicket.set(String(it.ticket), it.id);
        }

        const upgradedTickets = new Set<string>();

        for (const t of newTrades) {
          // Level 1: ticket match
          let matchId = t.ticket ? importByTicket.get(t.ticket) : undefined;

          // Level 2: composite match
          if (!matchId) {
            const normSyncPair = (t.pair ?? "").replace(/\.[a-z]+$/i, "").replace(/[_\-\s]/g, "").toUpperCase();
            const key = `${normSyncPair}|${t.trade_date}|${t.entry_price}|${t.exit_price}`;
            const match = importByComposite.get(key);
            if (match) matchId = match.id;
          }

          if (matchId) {
            // UPDATE the import trade with sync data (sync is authoritative)
            // Preserve import-only fields: risk_reward, tags, notes, strategy_id
            await sb.from("trades").update({
              source: "sync",
              ticket: t.ticket,
              trading_account_id: t.trading_account_id,
              profit_dollar: t.profit_dollar,
              pips: t.pips,
              is_win: t.is_win,
              pair: t.pair,
              entry_time: t.entry_time,
              exit_time: t.exit_time,
              duration_minutes: t.duration_minutes,
              // DO NOT overwrite: risk_reward, tags, notes, strategy_id
            }).eq("id", matchId);

            upgradedTickets.add(t.ticket);
          }
        }

        if (upgradedTickets.size > 0) {
          syncLogger.info({ count: upgradedTickets.size }, "Upgraded import trades to sync (cross-source dedup)");
          // Remove upgraded trades from newTrades to avoid duplicate insert
          newTrades = newTrades.filter((t) => !upgradedTickets.has(t.ticket));
        }
      }
    } catch (dedupErr) {
      // Non-blocking: if cross-source dedup fails, proceed with normal upsert
      syncLogger.warn({ error: dedupErr }, "Cross-source dedup failed (non-blocking)");
    }

    // 9.9) Before upserting trades, verify account wasn't deleted during sync
    const { data: stillActive } = await sb
      .from("trading_accounts")
      .select("id, deleted_at")
      .eq("id", tradingAccountId)
      .single();

    if (!stillActive || stillActive.deleted_at) {
      syncLogger.warn({ tradingAccountId }, "Account was deleted during sync, aborting");
      if (metaApiId) {
        try { await undeployAccount(metaApiId); } catch {}
      }
      return { success: false, tradesImported: 0, error: "Conta foi deletada durante a sincronização." };
    }

    // 10) Upsert trades (usar ticket como chave única)
    let imported = 0;
    const { data: existing } = await sb
      .from("trades")
      .select("ticket, profit_dollar, trade_date")
      .eq("trading_account_id", tradingAccountId)
      .eq("user_id", userId);

    const existingByTicket = new Map(
      (existing ?? []).map(
        (t: { ticket: string; profit_dollar: number; trade_date: string }) => [
          t.ticket,
          { profit_dollar: t.profit_dollar, trade_date: t.trade_date },
        ]
      )
    );

    if (newTrades.length > 0) {
      const toInsert = newTrades.filter((t) => !existingByTicket.has(t.ticket));
      const toUpdate = newTrades.filter((t) => {
        const cur = existingByTicket.get(t.ticket);
        return cur != null && cur.profit_dollar === 0 && t.profit_dollar !== 0;
      });

      if (toInsert.length > 0) {
        for (let i = 0; i < toInsert.length; i += 100) {
          const batch = toInsert.slice(i, i + 100);
          const { error: insertErr } = await sb.from("trades").insert(batch);
          if (insertErr) {
            syncLogger.error({ error: insertErr.message }, "Insert error");
          }
        }
        imported = toInsert.length;
      }

      for (const t of toUpdate) {
        const { error: updErr } = await sb
          .from("trades")
          .update({
            profit_dollar: t.profit_dollar,
            pips: t.pips,
            is_win: t.is_win,
            exit_price: t.exit_price,
            exit_time: t.exit_time,
            duration_minutes: t.duration_minutes,
          })
          .eq("trading_account_id", tradingAccountId)
          .eq("user_id", userId)
          .eq("ticket", t.ticket);
        if (!updErr) imported++;
      }
    }

    // 10.5) Corrigir trades já no DB com P&L zerado via MetaStats (ex: 19/fev)
    const zeroInDb = (existing ?? []).filter(
      (t: { profit_dollar: number }) => t.profit_dollar === 0
    );
    if (zeroInDb.length > 0) {
      const dates = zeroInDb.map(
        (t: { trade_date: string }) => t.trade_date
      ) as string[];
      const minDate = dates.reduce((a, b) => (a < b ? a : b));
      const maxDate = dates.reduce((a, b) => (a > b ? a : b));
      const fixStart = `${minDate}T00:00:00.000Z`;
      const fixEnd = new Date(new Date(maxDate).getTime() + 86400000 * 2).toISOString();
      syncLogger.info({ count: zeroInDb.length }, "Fixing zero-profit trades in DB via MetaStats");
      const msTrades = await getMetaStatsHistoricalTrades(
        metaApiId!,
        fixStart,
        fixEnd,
        region
      );
      const msByPos = new Map(msTrades.map((t) => [t.positionId, t]));
      for (const row of zeroInDb as { ticket: string; profit_dollar: number }[]) {
        const ms = msByPos.get(row.ticket);
        if (!ms || ms.profit === 0) continue;
        const profit = toNum(ms.profit);
        const isWin = ms.success === "won" || profit > 0;
        const pips = ms.pips != null ? toNum(ms.pips) : 0;
        const { error: updErr } = await sb
          .from("trades")
          .update({
            profit_dollar: Math.round(profit * 100) / 100,
            pips,
            is_win: isWin,
            ...(ms.closePrice != null && { exit_price: ms.closePrice }),
            ...(ms.closeTime && {
              exit_time: ms.closeTime.slice(11, 19),
            }),
            ...(ms.durationInMinutes != null && {
              duration_minutes: ms.durationInMinutes,
            }),
          })
          .eq("trading_account_id", tradingAccountId)
          .eq("user_id", userId)
          .eq("ticket", row.ticket);
        if (!updErr) {
          imported++;
          syncLogger.debug({ ticket: row.ticket }, "MetaStats corrected existing trade");
        }
      }
    }

    syncLogger.info({ imported, tradingAccountId }, "Trades imported");

    // 10.9) Fetch MetaStats metrics while account is still deployed (zero extra cost)
    let metastatsMetrics: Record<string, unknown> | null = null;
    try {
      const metricsUrl = `${metastatsBase(region)}/users/current/accounts/${metaApiId}/metrics`;
      syncLogger.debug({ metricsUrl }, "Fetching MetaStats metrics");
      let metricsRes = await metaFetchRetry(metricsUrl);

      // Handle 202 (calculating) — max 3 retries
      let metricsRetries = 0;
      while (metricsRes.status === 202 && metricsRetries < 3) {
        const rawWait = parseInt(metricsRes.headers.get("retry-after") || "5", 10);
        const waitSec = Number.isNaN(rawWait) || rawWait <= 0 ? 5 : rawWait;
        syncLogger.info({ waitSec }, "MetaStats calculating, retrying");
        await sleep(waitSec * 1000);
        metricsRes = await metaFetchRetry(metricsUrl);
        metricsRetries++;
      }

      if (metricsRes.status === 200) {
        metastatsMetrics = await metricsRes.json();
        syncLogger.info({ keys: Object.keys(metastatsMetrics as Record<string, unknown>).length }, "MetaStats metrics fetched successfully");
      } else {
        const errBody = await metricsRes.text().catch(() => "");
        syncLogger.warn({ status: metricsRes.status, body: errBody.slice(0, 200) }, "MetaStats returned non-200");
      }
    } catch (metricsErr) {
      syncLogger.error({ error: metricsErr }, "MetaStats fetch failed (non-blocking)");
      // Non-blocking — sync continues without metrics
    }

    // 10.9.5) Store metrics in account_metrics table
    if (metastatsMetrics) {
      try {
        // MetaStats API returns { metrics: { gain, profitFactor, ... } }
        const metricsInner = (metastatsMetrics as Record<string, unknown>).metrics ?? metastatsMetrics;
        const summary = extractMetricsSummary(metricsInner as Record<string, unknown>);
        await sb.from("account_metrics").upsert({
          trading_account_id: tradingAccountId,
          user_id: userId,
          metrics_data: metastatsMetrics,
          metrics_summary: summary,
          trades_count: (metricsInner as Record<string, unknown>).trades ?? imported,
          updated_at: new Date().toISOString(),
        }, { onConflict: "trading_account_id" });
        syncLogger.info("MetaStats metrics stored");
      } catch (storeErr) {
        syncLogger.error({ error: storeErr }, "Failed to store MetaStats metrics");
      }
    }

    // 11) Atualizar conta no DB
    // IMPORTANTE: Só atualizar last_sync_at se realmente importou trades
    // OU se já existiam trades (incremental sync legítimo com 0 novos)
    const now = new Date().toISOString();
    const shouldUpdateSyncTime = imported > 0 || hasExistingTrades;

    await sb
      .from("trading_accounts")
      .update({
        status: "connected",
        auto_sync_enabled: true,
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
    const cid = crypto.randomUUID();
    syncLogger.error({ correlationId: cid, error: err instanceof Error ? err.message : "Unknown" }, "syncAccountWithMetaApi error");

    // Attempt to undeploy MetaApi account on error (cleanup)
    if (metaApiId) {
      try {
        await undeployAccount(metaApiId);
        syncLogger.info({ metaApiId }, "Undeployed account after error");
      } catch (undeployErr) {
        syncLogger.error({ error: undeployErr, metaApiId }, "Failed to undeploy after error");
      }
    }

    return { success: false, error: "Erro inesperado na sincronização. Tente novamente." };
  }
}

/* ─── Utils ─── */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

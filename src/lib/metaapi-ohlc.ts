/**
 * MetaApi Historical Candles (OHLC).
 * Usado quando o trade vem de conta MetaApi – dados do broker real.
 * Timeout curto (8s) para não travar – fallback para Finnhub/Twelve Data.
 *
 * Docs: https://metaapi.cloud/docs/client/restApi/api/retrieveMarketData/readHistoricalCandles/
 */

const METAAPI_MARKET_DATA_TIMEOUT_MS = 8_000;

/** Mapeia interval (TakeZ) → timeframe (MetaApi MT5). */
const INTERVAL_TO_TIMEFRAME: Record<string, string> = {
  "1min": "1m",
  "5min": "5m",
  "15min": "15m",
  "30min": "30m",
  "1h": "1h",
  "2h": "2h",
  "4h": "4h",
  "1day": "1d",
};

export type MetaApiCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/**
 * Busca candles históricos via MetaApi.
 * Retorna null em caso de timeout, erro ou dados vazios.
 */
export async function fetchMetaApiCandles(
  accountId: string,
  symbol: string,
  interval: string,
  startDate: string,
  endDate: string,
  region = "new-york"
): Promise<MetaApiCandle[] | null> {
  const token = process.env.METAAPI_TOKEN;
  if (!token) return null;

  const timeframe = INTERVAL_TO_TIMEFRAME[interval] ?? "5m";
  const brokerSymbol = symbol.replace(/[\/_\-]/g, "").toUpperCase();
  const endTime = `${endDate}T23:59:59.000Z`;

  const base = `https://mt-market-data-client-api-v1.${region}.agiliumtrade.ai`;
  const url = `${base}/users/current/accounts/${accountId}/historical-market-data/symbols/${brokerSymbol}/timeframes/${timeframe}/candles?startTime=${encodeURIComponent(endTime)}&limit=1000`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), METAAPI_MARKET_DATA_TIMEOUT_MS);

  const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "auth-token": token,
      },
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = (await res.json()) as Array<{
      time?: string;
      open?: number;
      high?: number;
      low?: number;
      close?: number;
    }>;

    if (!Array.isArray(data) || data.length === 0) return null;

    const fromTs = Math.floor(new Date(startDate + "T00:00:00Z").getTime() / 1000);
    const toTs = Math.floor(new Date(endDate + "T23:59:59Z").getTime() / 1000);

    const bars: MetaApiCandle[] = [];
    for (const c of data) {
      const timeStr = c.time;
      if (!timeStr || c.open == null || c.high == null || c.low == null || c.close == null) continue;
      const ts = Math.floor(new Date(timeStr).getTime() / 1000);
      if (ts < fromTs || ts > toTs) continue;
      bars.push({
        time: ts,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      });
    }

    bars.sort((a, b) => a.time - b.time);
    return bars.length > 0 ? bars : null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  } finally {
    if (prevTls === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
  }
}

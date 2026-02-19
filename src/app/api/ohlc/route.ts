import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchMetaApiCandles } from "@/lib/metaapi-ohlc";

type BarItem = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/** Cache de 24h – dados históricos não mudam, economiza créditos Twelve Data. */
const CACHE_REVALIDATE_SEC = 86400; // 24 horas

/**
 * Converte símbolos do broker (XAUUSD, EURUSD, GBPJPY) para Finnhub OANDA.
 * Ex: XAUUSD → OANDA:XAU_USD, EURUSD → OANDA:EUR_USD
 */
function toFinnhubSymbol(raw: string): string {
  const s = raw.replace("_", "").replace("-", "").replace("/", "").toUpperCase();
  if (s.length >= 6) {
    const base = s.slice(0, 3);
    const quote = s.slice(3, 6);
    return `OANDA:${base}_${quote}`;
  }
  return `OANDA:${s}`;
}

/** Mapeia interval para Finnhub resolution. */
function toFinnhubResolution(interval: string): string {
  const map: Record<string, string> = {
    "1min": "1",
    "5min": "5",
    "15min": "15",
    "30min": "30",
    "1h": "60",
    "2h": "60",
    "4h": "60",
    "1day": "D",
  };
  return map[interval] ?? "5";
}

/** Converte para Twelve Data: XAUUSD → XAU/USD. */
function toTwelveDataSymbol(raw: string): string {
  const s = raw.replace("_", "/").replace("-", "/").toUpperCase();
  if (s.includes("/")) return s;
  const commodityPrefixes = ["XAU", "XAG", "XPT", "XPD"];
  for (const prefix of commodityPrefixes) {
    if (s.startsWith(prefix) && s.length === 6) return `${prefix}/${s.slice(3)}`;
  }
  if (s.length === 6) return `${s.slice(0, 3)}/${s.slice(3)}`;
  return s;
}

/** Mapeia interval para Twelve Data. */
function toTwelveDataInterval(interval: string): string {
  const map: Record<string, string> = {
    "1min": "1min",
    "5min": "5min",
    "15min": "15min",
    "30min": "30min",
    "1h": "1h",
    "2h": "2h",
    "4h": "4h",
    "1day": "1day",
  };
  return map[interval] ?? "5min";
}

/**
 * Busca OHLC via Finnhub (free tier, 60 req/min).
 * https://finnhub.io/docs/api/forex-candles
 */
async function fetchFinnhub(
  symbol: string,
  fromTs: number,
  toTs: number,
  resolution: string
): Promise<BarItem[] | null> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token || token === "demo") return null;

  const url = new URL("https://finnhub.io/api/v1/forex/candle");
  url.searchParams.set("symbol", toFinnhubSymbol(symbol));
  url.searchParams.set("resolution", resolution);
  url.searchParams.set("from", String(fromTs));
  url.searchParams.set("to", String(toTs));
  url.searchParams.set("token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json()) as {
    s?: string;
    t?: number[];
    o?: number[];
    h?: number[];
    l?: number[];
    c?: number[];
  };

  if (!res.ok || data.s !== "ok" || !data.t?.length) return null;

  const bars: BarItem[] = [];
  for (let i = 0; i < (data.t?.length ?? 0); i++) {
    bars.push({
      time: data.t![i]!,
      open: data.o![i] ?? 0,
      high: data.h![i] ?? 0,
      low: data.l![i] ?? 0,
      close: data.c![i] ?? 0,
    });
  }
  bars.sort((a, b) => a.time - b.time);
  return bars;
}

/**
 * Busca OHLC via Twelve Data (usa créditos – fallback quando Finnhub falhar).
 * Limita outputsize para economizar.
 */
async function fetchTwelveData(
  symbol: string,
  startDate: string,
  endDate: string,
  interval: string
): Promise<BarItem[] | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey || apiKey === "demo") return null;

  const twelveSymbol = toTwelveDataSymbol(symbol);
  const validInterval = toTwelveDataInterval(interval);
  const start = `${startDate}T00:00:00`;
  const end = `${endDate}T23:59:59`;

  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", twelveSymbol);
  url.searchParams.set("interval", validInterval);
  url.searchParams.set("start_date", start);
  url.searchParams.set("end_date", end);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set("outputsize", "5000"); // limite razoável
  url.searchParams.set("order", "asc");

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json()) as {
    status?: string;
    values?: { datetime: string; open: string; high: string; low: string; close: string }[];
    message?: string;
  };

  if (!res.ok || data.status === "error" || !data.values?.length) return null;

  const seenTimes = new Set<number>();
  const bars: BarItem[] = [];
  for (const v of data.values) {
    const dt = v.datetime.includes("T") ? v.datetime : v.datetime.replace(" ", "T");
    const ts = Math.floor(new Date(dt + "Z").getTime() / 1000);
    if (seenTimes.has(ts)) continue;
    seenTimes.add(ts);
    bars.push({
      time: ts,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
    });
  }
  bars.sort((a, b) => a.time - b.time);
  return bars;
}

/**
 * Busca OHLC (lógica interna, pode ser cacheada).
 */
async function fetchOhlcInternal(
  symbol: string,
  startDate: string,
  endDate: string,
  interval: string,
  fromTs: number,
  toTs: number
): Promise<{ bars: BarItem[]; source: string } | null> {
  const resolution = toFinnhubResolution(interval);

  // 1. Finnhub (grátis)
  let bars = await fetchFinnhub(symbol, fromTs, toTs, resolution);
  if (bars?.length) return { bars, source: "finnhub" };

  // 2. Twelve Data (usa créditos – fallback)
  bars = await fetchTwelveData(symbol, startDate, endDate, interval);
  if (bars?.length) return { bars, source: "twelvedata" };

  return null;
}

/**
 * GET /api/ohlc?symbol=XAUUSD&startDate=2024-01-15&endDate=2024-01-16&interval=5min
 *     &metaapiAccountId=xxx&region=new-york  (opcional – quando trade vem de conta MetaApi)
 *
 * Ordem: MetaApi (se conta vinculada) → Finnhub → Twelve Data.
 * MetaApi com timeout 8s – não trava.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get("symbol")?.trim();
  const startDate = searchParams.get("startDate")?.trim();
  const endDate = searchParams.get("endDate")?.trim();
  const interval = searchParams.get("interval") ?? "5min";
  const metaapiAccountId = searchParams.get("metaapiAccountId")?.trim() || null;
  const region = searchParams.get("region")?.trim() || "new-york";

  if (!symbol || !startDate || !endDate) {
    return NextResponse.json(
      { error: "symbol, startDate e endDate são obrigatórios" },
      { status: 400 }
    );
  }

  const validIntervals = ["1min", "5min", "15min", "30min", "1h", "2h", "4h", "1day"];
  const validInterval = validIntervals.includes(interval) ? interval : "5min";

  const fromTs = Math.floor(new Date(startDate + "T00:00:00Z").getTime() / 1000);
  const toTs = Math.floor(new Date(endDate + "T23:59:59Z").getTime() / 1000);

  if (metaapiAccountId) {
    const metaBars = await fetchMetaApiCandles(
      metaapiAccountId,
      symbol,
      validInterval,
      startDate,
      endDate,
      region
    );
    if (metaBars && metaBars.length > 0) {
      return NextResponse.json(
        { bars: metaBars, meta: { source: "metaapi" }, count: metaBars.length },
        {
          headers: {
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
          },
        }
      );
    }
  }

  const cacheKey = `ohlc-${symbol}-${startDate}-${endDate}-${validInterval}`;
  const getCached = unstable_cache(
    () => fetchOhlcInternal(symbol, startDate, endDate, validInterval, fromTs, toTs),
    [cacheKey],
    { revalidate: CACHE_REVALIDATE_SEC, tags: ["ohlc"] }
  );

  const result = await getCached();

  if (!result) {
    return NextResponse.json(
      {
        error:
          "Nenhum dado encontrado. Configure FINNHUB_API_KEY ou TWELVE_DATA_API_KEY.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      bars: result.bars,
      meta: { source: result.source },
      count: result.bars.length,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    }
  );
}

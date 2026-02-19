import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

/** Cache 6h – eventos econômicos não mudam com frequência */
const CACHE_REVALIDATE_SEC = 21600;

export type EconomicEvent = {
  date: string;
  time?: string;
  country?: string;
  event?: string;
  currency?: string;
  impact?: "high" | "medium" | "low";
  actual?: string | number;
  forecast?: string | number;
  previous?: string | number;
  [key: string]: unknown;
};

/** Finnhub economic calendar – gratuito no plano free */
async function fetchFinnhub(from: string, to: string): Promise<EconomicEvent[]> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token || token === "demo") return [];

  const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${token}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const raw = (await res.json()) as unknown;
  let data: unknown[] = [];
  if (Array.isArray(raw)) data = raw;
  else if (raw && typeof raw === "object" && "economicCalendar" in raw && Array.isArray((raw as { economicCalendar: unknown[] }).economicCalendar)) {
    data = (raw as { economicCalendar: unknown[] }).economicCalendar;
  } else if (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown[] }).data)) {
    data = (raw as { data: unknown[] }).data;
  }
  if (data.length === 0) return [];

  return data.map((item) => {
    const i = item as Record<string, unknown>;
    const date = i.date ?? i.time;
    const dateStr = typeof date === "number" ? new Date(date * 1000).toISOString().slice(0, 10) : String(date ?? "").slice(0, 10);
    const timeStr = i.time != null ? new Date(Number(i.time) * 1000).toISOString().slice(11, 16) : undefined;
    return {
      date: dateStr,
      time: timeStr,
      country: i.country != null ? String(i.country) : undefined,
      event: String(i.event ?? i.title ?? i.name ?? ""),
      currency: i.currency != null ? String(i.currency) : undefined,
      impact: normalizeImpact(i.impact ?? i.importance),
      actual: (i.actual ?? i.value) as string | number | undefined,
      forecast: (i.estimate ?? i.forecast) as string | number | undefined,
      previous: (i.prior ?? i.previous) as string | number | undefined,
    } as EconomicEvent;
  });
}

/** FMP economic calendar – requer plano premium (retorna 402 no free) */
async function fetchFMP(from: string, to: string): Promise<EconomicEvent[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://financialmodelingprep.com/stable/economic-calendar");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (res.status === 402) return []; // Premium required
  if (!res.ok) return [];

  const text = await res.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return [];
  }

  let data: unknown[] = [];
  if (Array.isArray(raw)) {
    data = raw;
  } else if (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown[] }).data)) {
    data = (raw as { data: unknown[] }).data;
  } else if (raw && typeof raw === "object" && "results" in raw && Array.isArray((raw as { results: unknown[] }).results)) {
    data = (raw as { results: unknown[] }).results;
  }

  if (data.length === 0) return [];

  return data.map((item) => {
    const i = item as Record<string, unknown>;
    const ev: EconomicEvent = {
      ...i,
      date: String(i.date ?? i.releaseDate ?? ""),
      time: i.time != null ? String(i.time) : undefined,
      country: i.country != null ? String(i.country) : undefined,
      event: String(i.event ?? i.title ?? i.name ?? ""),
      currency: i.currency != null ? String(i.currency) : undefined,
      impact: normalizeImpact(i.impact ?? i.importance),
      actual: (i.actual ?? i.value) as string | number | undefined,
      forecast: (i.forecast ?? i.estimate) as string | number | undefined,
      previous: (i.previous ?? i.prior) as string | number | undefined,
    };
    return ev;
  });
}

function normalizeImpact(
  val: unknown
): "high" | "medium" | "low" | undefined {
  if (val == null) return undefined;
  const s = String(val).toLowerCase();
  if (s.includes("high") || s === "3" || s === "high") return "high";
  if (s.includes("medium") || s === "2" || s === "medium") return "medium";
  if (s.includes("low") || s === "1" || s === "low") return "low";
  return undefined;
}

async function fetchEconomicCalendar(from: string, to: string): Promise<EconomicEvent[]> {
  const finnhub = await fetchFinnhub(from, to);
  if (finnhub.length > 0) return finnhub;
  return fetchFMP(from, to);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? getDefaultFrom();
  const to = searchParams.get("to") ?? getDefaultTo();

  const fetcher = () => fetchEconomicCalendar(from, to);
  const cached = unstable_cache(
    fetcher,
    ["economic-calendar", from, to],
    { revalidate: CACHE_REVALIDATE_SEC }
  );

  const events = await cached();
  return NextResponse.json(events);
}

function getDefaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getDefaultTo(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

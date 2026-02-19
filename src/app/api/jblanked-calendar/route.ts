import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Horas até considerar cache expirado. Notícias mudam semanalmente. */
const CACHE_HOURS_TODAY = 12;
const CACHE_HOURS_WEEK = 168; // 7 dias
const CACHE_HOURS_RANGE = 168; // 7 dias

type JBlankedEvent = {
  Name?: string;
  Currency?: string;
  Event_ID?: number;
  Category?: string;
  Impact?: string;
  Date?: string;
  Actual?: number;
  Forecast?: number;
  Previous?: number;
  Outcome?: string;
  Strength?: string;
  Quality?: string;
  Projection?: string;
};

type FetchResult = { ok: true; data: JBlankedEvent[] } | { ok: false; error: string };

async function fetchJBlanked(
  period: "today" | "week" | "range",
  from?: string,
  to?: string
): Promise<FetchResult> {
  const apiKey = process.env.JB_API_KEY;
  if (!apiKey) return { ok: false, error: "API key not configured" };

  const base = "https://www.jblanked.com/news/api/mql5/calendar";
  let url: string;

  if (period === "today") {
    url = `${base}/today/`;
  } else if (period === "week") {
    url = `${base}/week/`;
  } else {
    if (!from || !to) return { ok: false, error: "Missing from/to for range" };
    url = `${base}/range/?from=${from}&to=${to}`;
  }

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    let errMsg = `API returned ${res.status}`;
    try {
      const json = JSON.parse(body) as { detail?: string; message?: string };
      errMsg = json.detail ?? json.message ?? errMsg;
    } catch {
      if (body) errMsg += `: ${body.slice(0, 200)}`;
    }
    return { ok: false, error: errMsg };
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return { ok: false, error: "Invalid API response" };

  return { ok: true, data: data as JBlankedEvent[] };
}

function normalizeImpact(val?: string): "high" | "medium" | "low" | "none" | undefined {
  if (!val) return undefined;
  const s = String(val).toLowerCase();
  if (s === "high") return "high";
  if (s === "medium") return "medium";
  if (s === "low") return "low";
  if (s === "none") return "none";
  return undefined;
}

export type CalendarEvent = {
  eventId?: number;
  name: string;
  currency?: string;
  category?: string;
  impact?: "high" | "medium" | "low" | "none";
  date: string;
  time?: string;
  actual?: number;
  forecast?: number;
  previous?: number;
  outcome?: string;
  strength?: string;
  quality?: string;
  projection?: string;
};

function mapEvent(e: JBlankedEvent): CalendarEvent {
  const dateStr = e.Date ?? "";
  const [datePart, timePart] = dateStr.split(" ");
  return {
    eventId: e.Event_ID,
    name: e.Name ?? "",
    currency: e.Currency,
    category: e.Category,
    impact: normalizeImpact(e.Impact),
    date: datePart?.replace(/\./g, "-") ?? "",
    time: timePart,
    actual: e.Actual,
    forecast: e.Forecast,
    previous: e.Previous,
    outcome: e.Outcome,
    strength: e.Strength,
    quality: e.Quality,
    projection: e.Projection,
  };
}

function getCacheKey(period: string, from: string, to: string): string {
  if (period === "today") {
    const today = new Date().toISOString().slice(0, 10);
    return `today-${today}`;
  }
  if (period === "week") {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const weekStart = start.toISOString().slice(0, 10);
    return `week-${weekStart}`;
  }
  return `range-${from}-${to}`;
}

function getCacheHours(period: string): number {
  if (period === "today") return CACHE_HOURS_TODAY;
  if (period === "week") return CACHE_HOURS_WEEK;
  return CACHE_HOURS_RANGE;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") ?? "week") as "today" | "week" | "range";
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const refresh = searchParams.get("refresh") === "1";

    const cacheKey = getCacheKey(period, from, to);
    const cacheHours = getCacheHours(period);
    const cutoff = new Date(Date.now() - cacheHours * 60 * 60 * 1000);

    if (!refresh) {
      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: row } = await (supabase as any)
          .from("economic_calendar_cache")
          .select("data, fetched_at")
          .eq("cache_key", cacheKey)
          .single();

        const cached = row as { data: unknown; fetched_at: string } | null;
        if (cached && new Date(cached.fetched_at) > cutoff) {
          const events = cached.data as CalendarEvent[];
          return NextResponse.json(Array.isArray(events) ? events : []);
        }
      } catch {
        // Tabela pode não existir ainda; segue para fetch
      }
    }

    const result = await fetchJBlanked(
      period,
      from || undefined,
      to || undefined
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 502 }
      );
    }

    const events = result.data.map(mapEvent);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("economic_calendar_cache").upsert(
        {
          cache_key: cacheKey,
          data: events,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "cache_key" }
      );
    } catch {
      // Falha ao salvar não impede resposta
    }

    return NextResponse.json(events);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

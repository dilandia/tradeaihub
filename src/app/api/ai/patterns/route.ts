import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePatternInsights } from "@/lib/ai/agents/pattern-detection";
import { getCachedInsight, setCachedInsight } from "@/lib/ai/cache";
import { checkAndConsumeAiCredits } from "@/lib/ai/plan-gate";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { filterByDateRange } from "@/lib/dashboard-calc";
import type { CalendarTrade } from "@/lib/calendar-utils";

function buildPatternsFromTrades(trades: CalendarTrade[]) {
  const byDay: Record<string, { wins: number; total: number; pnl: number }> = {};
  const byHour: Record<string, { wins: number; total: number }> = {};
  const byPair: Record<string, { wins: number; total: number; pnl: number }> = {};

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const tv = (t: CalendarTrade) => (t.profit_dollar != null ? t.profit_dollar : t.pips);

  for (const t of trades) {
    const pnl = tv(t);
    const d = new Date(t.date);
    const dayKey = DAYS[d.getDay()];
    if (!byDay[dayKey]) byDay[dayKey] = { wins: 0, total: 0, pnl: 0 };
    byDay[dayKey].total++;
    byDay[dayKey].wins += t.is_win ? 1 : 0;
    byDay[dayKey].pnl += pnl;

    if (t.entry_time) {
      const h = parseInt(t.entry_time.split(":")[0], 10);
      const hourKey = `${h}h`;
      if (!byHour[hourKey]) byHour[hourKey] = { wins: 0, total: 0 };
      byHour[hourKey].total++;
      byHour[hourKey].wins += t.is_win ? 1 : 0;
    }

    const pair = t.pair || "Unknown";
    if (!byPair[pair]) byPair[pair] = { wins: 0, total: 0, pnl: 0 };
    byPair[pair].total++;
    byPair[pair].wins += t.is_win ? 1 : 0;
    byPair[pair].pnl += pnl;
  }

  return { byDayOfWeek: byDay, byHour, byPair };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { importId, accountId, period = "all", locale = "en" } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trades = await getTrades(importId, accountId);
    const calendarTrades = toCalendarTrades(trades);
    const filtered = filterByDateRange(calendarTrades, period);

    if (filtered.length === 0) {
      const msg = locale?.startsWith("pt")
        ? "Nenhum trade no período selecionado. Adicione ou importe trades para obter insights de padrões."
        : "No trades in the selected period. Add or import trades to get pattern insights.";
      return NextResponse.json({ insights: msg });
    }

    const cacheParams = { importId, accountId, period, locale };
    const cached = await getCachedInsight("patterns", cacheParams);
    if (cached) return NextResponse.json({ insights: cached, cached: true });

    const gate = await checkAndConsumeAiCredits(user.id);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, code: gate.code },
        { status: 403 }
      );
    }

    const patterns = buildPatternsFromTrades(filtered as CalendarTrade[]);

    const insights = await generatePatternInsights({
      patterns,
      locale,
    });

    await setCachedInsight("patterns", cacheParams, insights);
    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[AI patterns]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: msg.includes("OPENAI") ? "Configure OPENAI_API_KEY in .env.local" : msg },
      { status: 500 }
    );
  }
}

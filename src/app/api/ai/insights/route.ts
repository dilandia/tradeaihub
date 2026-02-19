import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePerformanceInsights } from "@/lib/ai/agents/performance-insights";
import { getCachedInsight, setCachedInsight } from "@/lib/ai/cache";
import { checkAndConsumeAiCredits } from "@/lib/ai/plan-gate";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { filterByDateRange, buildPerformanceMetrics } from "@/lib/dashboard-calc";
import type { CalendarTrade } from "@/lib/calendar-utils";

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
        ? "Nenhum trade no período selecionado. Adicione ou importe trades para obter insights de IA."
        : "No trades in the selected period. Add or import trades to get AI insights.";
      return NextResponse.json({ insights: msg });
    }

    const cacheParams = { importId, accountId, period, locale };
    const cached = await getCachedInsight("insights", cacheParams);
    if (cached) return NextResponse.json({ insights: cached, cached: true });

    const gate = await checkAndConsumeAiCredits(user.id);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, code: gate.code },
        { status: 403 }
      );
    }

    const metrics = buildPerformanceMetrics(filtered as CalendarTrade[], true);

    const insights = await generatePerformanceInsights({
      metrics: {
        winRate: metrics.winRate,
        profitFactor: metrics.profitFactor,
        totalTrades: metrics.totalTrades,
        netPnl: metrics.netPnl,
        maxConsecutiveLosses: metrics.maxConsecutiveLosses,
        maxConsecutiveWins: metrics.maxConsecutiveWins,
        avgWinDollar: metrics.avgWinDollar,
        avgLossDollar: metrics.avgLossDollar,
        dayWinPct: metrics.winDays && (metrics.winDays + metrics.lossDays) > 0
          ? Math.round((metrics.winDays / (metrics.winDays + metrics.lossDays)) * 100)
          : null,
      },
      tradesCount: filtered.length,
      locale,
    });

    await setCachedInsight("insights", cacheParams, insights);
    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[AI insights]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: msg.includes("OPENAI") ? "Configure OPENAI_API_KEY in .env.local" : msg },
      { status: 500 }
    );
  }
}

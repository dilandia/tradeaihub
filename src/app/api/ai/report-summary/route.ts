import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReportSummary } from "@/lib/ai/agents/report-summary";
import { getCachedInsight, setCachedInsight } from "@/lib/ai/cache";
import { checkAiCredits, consumeCreditsAfterSuccess } from "@/lib/ai/plan-gate";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import {
  filterByDateRange,
  buildPerformanceMetrics,
} from "@/lib/dashboard-calc";
import type { CalendarTrade } from "@/lib/calendar-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportType, importId, accountId, period = "all", locale = "en" } = body;

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
      return NextResponse.json({ summary: msg });
    }

    const cacheParams = { importId, accountId, period, reportType: reportType ?? "Overview", locale };
    const cached = await getCachedInsight("report-summary", cacheParams);
    if (cached) return NextResponse.json({ summary: cached, cached: true });

    const gate = await checkAiCredits(user.id);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, code: gate.code },
        { status: 403 }
      );
    }

    const metrics = buildPerformanceMetrics(filtered as CalendarTrade[], true);
    const netPnl = metrics.netPnl;

    const summary = await generateReportSummary({
      reportType: reportType ?? "Overview",
      metrics: {
        winRate: metrics.winRate,
        profitFactor: metrics.profitFactor,
        totalTrades: metrics.totalTrades,
        netPnl,
        maxConsecutiveLosses: metrics.maxConsecutiveLosses,
        maxConsecutiveWins: metrics.maxConsecutiveWins,
      },
      tradesSummary: {
        totalTrades: filtered.length,
        wins: metrics.wins,
        netPnl,
        hasDollar: (filtered[0] as CalendarTrade & { profit_dollar?: number })?.profit_dollar != null,
      },
      locale,
    });

    await setCachedInsight("report-summary", cacheParams, summary);
    await consumeCreditsAfterSuccess(user.id);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[AI report-summary]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: msg.includes("OPENAI") ? "Configure OPENAI_API_KEY in .env.local" : msg },
      { status: 500 }
    );
  }
}

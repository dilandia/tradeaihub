import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrades, getTradesByDateRange, toCalendarTrades } from "@/lib/trades";
import { buildPerformanceMetrics } from "@/lib/dashboard-calc";
import { periodToDateRange } from "@/lib/date-utils";
import { getContextualSuggestions } from "@/lib/ai/copilot-suggestions";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CalendarTrade } from "@/lib/calendar-utils";

function buildCopilotMetrics(filtered: CalendarTrade[], metrics: ReturnType<typeof buildPerformanceMetrics>) {
  const winDays = metrics.winDays;
  const lossDays = metrics.lossDays;
  const totalDays = winDays + lossDays + metrics.breakevenDays;
  const dayWinPct = totalDays > 0 ? Math.round((winDays / totalDays) * 100) : 0;

  const losses = filtered.filter((t) => !t.is_win);
  const lossAmounts = losses.map((t) =>
    t.profit_dollar != null ? Math.abs(t.profit_dollar) : Math.abs(t.pips)
  );
  const avgRiskPerTrade =
    lossAmounts.length > 0
      ? lossAmounts.reduce((a, b) => a + b, 0) / lossAmounts.length
      : metrics.avgLossDollar;
  const stdLoss =
    lossAmounts.length > 1
      ? Math.sqrt(
          lossAmounts.reduce((s, v) => s + (v - avgRiskPerTrade) ** 2, 0) / lossAmounts.length
        )
      : 0;
  const cv = avgRiskPerTrade > 0 ? stdLoss / avgRiskPerTrade : 0;
  const riskConsistencyScore = Math.max(0, Math.min(100, Math.round(100 - cv * 50)));

  return {
    riskConsistencyScore,
    winRate: metrics.winRate,
    maxConsecutiveLosses: metrics.maxConsecutiveLosses,
    dayWinPct,
    profitFactor: metrics.profitFactor,
    totalTrades: metrics.totalTrades,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const importId = searchParams.get("import") ?? undefined;
    const accountId = searchParams.get("account") ?? undefined;
    const period = searchParams.get("period") ?? "all";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TDR-06: Rate limiting
    const { allowed: rateLimitAllowed, remaining, resetIn } = checkRateLimit(user.id);
    if (!rateLimitAllowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests. Please try again in ${Math.ceil(resetIn / 1000)} seconds.`,
          remaining: 0,
          resetIn: Math.ceil(resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
          },
        }
      );
    }

    // W3-01: Push date filtering to DB when period is not "all"
    const dateRange = periodToDateRange(period);
    const trades = dateRange
      ? await getTradesByDateRange(dateRange.startDate, dateRange.endDate, importId, accountId)
      : await getTrades(importId, accountId);
    const calendarTrades = toCalendarTrades(trades);
    const filtered = calendarTrades as CalendarTrade[];

    if (filtered.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const metrics = buildPerformanceMetrics(filtered, true);
    const copilotMetrics = buildCopilotMetrics(filtered, metrics);
    const suggestions = getContextualSuggestions(copilotMetrics);

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
        },
      }
    );
  } catch (err) {
    console.error("[AI Copilot suggestions]", err);
    return NextResponse.json({ error: "Failed to get suggestions" }, { status: 500 });
  }
}

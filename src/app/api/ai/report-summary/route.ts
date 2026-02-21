import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReportSummary } from "@/lib/ai/agents/report-summary";
import { getCachedInsight, setCachedInsight } from "@/lib/ai/cache";
import { checkAiCredits, consumeCreditsAfterSuccess } from "@/lib/ai/plan-gate";
import { getTrades, getTradesByDateRange, toCalendarTrades } from "@/lib/trades";
import { buildPerformanceMetrics } from "@/lib/dashboard-calc";
import { periodToDateRange } from "@/lib/date-utils";
import { ReportSummaryRequestSchema, validateAiRequest } from "@/lib/validation/ai-schemas";
import type { CalendarTrade } from "@/lib/calendar-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // TDR-07: Validate request input
    const validation = validateAiRequest(ReportSummaryRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error },
        { status: 400 }
      );
    }

    const { reportType, importId, accountId, period, locale } = validation.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
    const filtered = calendarTrades;

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
    return NextResponse.json(
      { summary },
      {
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
        },
      }
    );
  } catch (err) {
    console.error("[AI report-summary]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: msg.includes("OPENAI") ? "Configure OPENAI_API_KEY in .env.local" : msg },
      { status: 500 }
    );
  }
}

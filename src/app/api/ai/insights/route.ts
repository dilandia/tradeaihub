import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePerformanceInsights } from "@/lib/ai/agents/performance-insights";
import { getCachedInsight, setCachedInsight } from "@/lib/ai/cache";
import { checkAiCredits, consumeCreditsAfterSuccess } from "@/lib/ai/plan-gate";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { filterByDateRange, buildPerformanceMetrics } from "@/lib/dashboard-calc";
import { checkRateLimit } from "@/lib/rate-limit";
import { InsightsRequestSchema, validateAiRequest } from "@/lib/validation/ai-schemas";
import { getCorsHeaders, handleCorsPrelight } from "@/lib/cors";
import type { CalendarTrade } from "@/lib/calendar-utils";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPrelight(req.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    const body = await req.json();

    // TDR-07: Validate request input
    const validation = validateAiRequest(InsightsRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error },
        { status: 400, headers: corsHeaders }
      );
    }

    const { importId, accountId, period, locale } = validation.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // TDR-06: Rate limiting check
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
            ...corsHeaders,
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
          },
        }
      );
    }

    const trades = await getTrades(importId, accountId);
    const calendarTrades = toCalendarTrades(trades);
    const filtered = filterByDateRange(calendarTrades, period);

    if (filtered.length === 0) {
      const msg = locale?.startsWith("pt")
        ? "Nenhum trade no período selecionado. Adicione ou importe trades para obter insights de IA."
        : "No trades in the selected period. Add or import trades to get AI insights.";
      return NextResponse.json(
        { insights: msg },
        { headers: corsHeaders }
      );
    }

    const cacheParams = { importId, accountId, period, locale };
    const cached = await getCachedInsight("insights", cacheParams);
    if (cached)
      return NextResponse.json(
        { insights: cached, cached: true },
        { headers: corsHeaders }
      );

    const gate = await checkAiCredits(user.id);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, code: gate.code },
        { status: 403, headers: corsHeaders }
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
    await consumeCreditsAfterSuccess(user.id);
    return NextResponse.json(
      { insights },
      {
        headers: {
          ...corsHeaders,
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
        },
      }
    );
  } catch (err) {
    console.error("[AI insights]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    return NextResponse.json(
      { error: msg.includes("OPENAI") ? "Configure OPENAI_API_KEY in .env.local" : msg },
      { status: 500, headers: corsHeaders }
    );
  }
}

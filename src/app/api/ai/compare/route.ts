import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCompareAnalysis } from "@/lib/ai/agents/compare-analysis";
import { getCachedInsight, setCachedInsight } from "@/lib/ai/cache";
import { checkAiCredits, consumeCreditsAfterSuccess } from "@/lib/ai/plan-gate";
import { getTradesByDateRange, toCalendarTrades } from "@/lib/trades";
import { buildPerformanceMetrics } from "@/lib/dashboard-calc";
import { checkRateLimit } from "@/lib/rate-limit";
import { CompareRequestSchema, validateAiRequest } from "@/lib/validation/ai-schemas";
import { getCorsHeaders, handleCorsPrelight } from "@/lib/cors";
import { trackEvent } from "@/lib/email/events";
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
    const validation = validateAiRequest(CompareRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error },
        { status: 400, headers: corsHeaders }
      );
    }

    const {
      period1Start,
      period1End,
      period2Start,
      period2End,
      period1Label,
      period2Label,
      importId,
      accountId,
      locale,
    } = validation.data;

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

    // Fetch trades for both periods
    const [trades1Raw, trades2Raw] = await Promise.all([
      getTradesByDateRange(period1Start, period1End, importId, accountId),
      getTradesByDateRange(period2Start, period2End, importId, accountId),
    ]);

    const trades1 = toCalendarTrades(trades1Raw);
    const trades2 = toCalendarTrades(trades2Raw);

    if (trades1.length === 0 && trades2.length === 0) {
      const msg = locale?.startsWith("pt")
        ? "Nenhum trade encontrado em ambos os periodos. Adicione ou importe trades para comparar."
        : "No trades found in either period. Add or import trades to compare.";
      return NextResponse.json(
        { analysis: msg },
        { headers: corsHeaders }
      );
    }

    // Cache check — use date ranges as cache key parts
    const cacheParams = {
      importId,
      accountId,
      period: `compare:${period1Start}:${period1End}:${period2Start}:${period2End}`,
      locale,
    };
    const cached = await getCachedInsight("compare", cacheParams);
    if (cached) {
      return NextResponse.json(
        { analysis: cached, cached: true },
        { headers: corsHeaders }
      );
    }

    const gate = await checkAiCredits(user.id);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, code: gate.code },
        { status: 403, headers: corsHeaders }
      );
    }

    // Build metrics for both periods
    const metrics1 = buildPerformanceMetrics(trades1 as CalendarTrade[], true);
    const metrics2 = buildPerformanceMetrics(trades2 as CalendarTrade[], true);

    const label1 = period1Label || `${period1Start} to ${period1End}`;
    const label2 = period2Label || `${period2Start} to ${period2End}`;

    const analysis = await generateCompareAnalysis({
      period1Metrics: {
        winRate: metrics1.winRate,
        profitFactor: metrics1.profitFactor,
        totalTrades: metrics1.totalTrades,
        netPnl: metrics1.netPnl,
        maxConsecutiveLosses: metrics1.maxConsecutiveLosses,
        maxConsecutiveWins: metrics1.maxConsecutiveWins,
        avgWinDollar: metrics1.avgWinDollar,
        avgLossDollar: metrics1.avgLossDollar,
        tradeExpectancy: metrics1.tradeExpectancy,
        avgDailyWinPct: metrics1.avgDailyWinPct,
        tradesCount: trades1.length,
      },
      period2Metrics: {
        winRate: metrics2.winRate,
        profitFactor: metrics2.profitFactor,
        totalTrades: metrics2.totalTrades,
        netPnl: metrics2.netPnl,
        maxConsecutiveLosses: metrics2.maxConsecutiveLosses,
        maxConsecutiveWins: metrics2.maxConsecutiveWins,
        avgWinDollar: metrics2.avgWinDollar,
        avgLossDollar: metrics2.avgLossDollar,
        tradeExpectancy: metrics2.tradeExpectancy,
        avgDailyWinPct: metrics2.avgDailyWinPct,
        tradesCount: trades2.length,
      },
      period1Label: label1,
      period2Label: label2,
      locale,
    });

    await setCachedInsight("compare", cacheParams, analysis);
    await consumeCreditsAfterSuccess(user.id);
    trackEvent(user.id, "ai_agent_used", { agent_type: "compare" }).catch(() => {})

    return NextResponse.json(
      { analysis },
      {
        headers: {
          ...corsHeaders,
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
        },
      }
    );
  } catch (err) {
    console.error("[AI compare]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    return NextResponse.json(
      { error: msg.includes("OPENAI") ? "AI service temporarily unavailable" : msg },
      { status: 500, headers: corsHeaders }
    );
  }
}

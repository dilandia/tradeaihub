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

function getTopPairs(trades: CalendarTrade[], limit: number) {
  const counts = new Map<string, { total: number; wins: number; pnl: number }>();
  for (const t of trades) {
    const p = t.pair || "Unknown";
    const entry = counts.get(p) ?? { total: 0, wins: 0, pnl: 0 };
    entry.total++;
    if (t.is_win) entry.wins++;
    entry.pnl += t.profit_dollar ?? t.pips;
    counts.set(p, entry);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([pair, stats]) => ({
      pair,
      trades: stats.total,
      winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0,
      pnl: Math.round(stats.pnl * 100) / 100,
    }));
}

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }
    const user = session.user;

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

    // Cache check — use date ranges + trade counts as cache key parts
    const cacheParams = {
      importId,
      accountId,
      period: `compare:${period1Start}:${period1End}:${period2Start}:${period2End}:t${trades1Raw.length}:t${trades2Raw.length}`,
      locale,
    };
    const cached = await getCachedInsight("compare", cacheParams);
    if (cached) {
      return NextResponse.json(
        { analysis: cached, cached: true },
        { headers: corsHeaders }
      );
    }

    if (trades1.length === 0 && trades2.length === 0) {
      const msg = locale?.startsWith("pt")
        ? `Nenhum trade encontrado em ambos os periodos selecionados (${period1Start} a ${period1End} e ${period2Start} a ${period2End}). Verifique se voce tem trades importados/registrados nessas datas e tente novamente.`
        : `No trades found in either period (${period1Start} to ${period1End} and ${period2Start} to ${period2End}). Check if you have trades imported/registered in those dates and try again.`;
      return NextResponse.json(
        { analysis: msg },
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

    // Build enriched metrics with more context for the AI
    const buildEnrichedMetrics = (metrics: typeof metrics1, trades: typeof trades1, start: string, end: string) => ({
      dateRange: { start, end },
      tradesCount: trades.length,
      tradingDays: new Set(trades.map(t => t.date)).size,
      wins: metrics.wins,
      losses: metrics.losses,
      winRate: metrics.winRate,
      profitFactor: metrics.profitFactor,
      totalTrades: metrics.totalTrades,
      netPnl: metrics.netPnl,
      grossProfit: Math.round(metrics.avgWinDollar * metrics.wins * 100) / 100,
      grossLoss: Math.round(metrics.avgLossDollar * metrics.losses * 100) / 100,
      maxConsecutiveLosses: metrics.maxConsecutiveLosses,
      maxConsecutiveWins: metrics.maxConsecutiveWins,
      avgWinDollar: metrics.avgWinDollar,
      avgLossDollar: metrics.avgLossDollar,
      tradeExpectancy: metrics.tradeExpectancy,
      avgDailyWinPct: metrics.avgDailyWinPct,
      largestProfitableTrade: metrics.largestProfitableTrade,
      largestLosingTrade: metrics.largestLosingTrade,
      maxDailyDrawdown: metrics.maxDailyDrawdown,
      avgHoldTimeMinutes: metrics.avgHoldTimeMinutes,
      topPairs: getTopPairs(trades, 5),
    });

    const analysis = await generateCompareAnalysis({
      period1Metrics: buildEnrichedMetrics(metrics1, trades1, period1Start, period1End),
      period2Metrics: buildEnrichedMetrics(metrics2, trades2, period2Start, period2End),
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

import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRiskAnalysis } from "@/lib/ai/agents/risk-analysis";
import { getCachedInsight, setCachedInsight } from "@/lib/ai/cache";
import { checkAiCredits, consumeCreditsAfterSuccess } from "@/lib/ai/plan-gate";
import { getTrades, toCalendarTrades, getImportSummary } from "@/lib/trades";
import { getUserTradingAccounts } from "@/lib/trading-accounts";
import {
  filterByDateRange,
  buildPerformanceMetrics,
  computeClientMetrics,
  computeBalanceDrawdown,
} from "@/lib/dashboard-calc";
import { RiskRequestSchema, validateAiRequest } from "@/lib/validation/ai-schemas";
import type { CalendarTrade } from "@/lib/calendar-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // TDR-07: Validate request input
    const validation = validateAiRequest(RiskRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error },
        { status: 400 }
      );
    }

    const { importId, accountId, period, locale } = validation.data;

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

    const trades = await getTrades(importId, accountId);
    const calendarTrades = toCalendarTrades(trades);
    const filtered = filterByDateRange(calendarTrades, period);

    if (filtered.length === 0) {
      const msg = locale?.startsWith("pt")
        ? "Nenhum trade no período selecionado. Adicione ou importe trades para obter análise de risco."
        : "No trades in the selected period. Add or import trades to get risk analysis.";
      return NextResponse.json({ insights: msg });
    }

    const cacheParams = { importId, accountId, period, locale };
    const cached = await getCachedInsight("risk", cacheParams);
    if (cached) return NextResponse.json({ insights: cached, cached: true });

    const gate = await checkAiCredits(user.id);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, code: gate.code },
        { status: 403 }
      );
    }

    const metrics = buildPerformanceMetrics(filtered as CalendarTrade[], true);
    const clientMetrics = computeClientMetrics(filtered as CalendarTrade[]);

    let balanceDrawdownPct: number | undefined;
    let balanceDrawdownDollar: number | undefined;

    if (importId) {
      const summary = await getImportSummary(importId);
      if (summary?.balance_drawdown_maximal_pct != null) {
        balanceDrawdownPct = summary.balance_drawdown_maximal_pct;
        balanceDrawdownDollar = summary.balance_drawdown_maximal ?? undefined;
      }
    } else if (accountId) {
      const accounts = await getUserTradingAccounts();
      const account = accounts.find((a) => a.id === accountId);
      if (account?.balance != null && metrics.netPnl != null) {
        const initialBalance = account.balance - metrics.netPnl;
        const balanceDD = computeBalanceDrawdown(initialBalance, filtered as CalendarTrade[], true);
        balanceDrawdownPct = balanceDD.drawdownPct;
        balanceDrawdownDollar = balanceDD.drawdownDollar;
      }
    }

    const insights = await generateRiskAnalysis({
      maxConsecutiveLosses: metrics.maxConsecutiveLosses,
      maxConsecutiveLossesMoney: metrics.maxConsecutiveLosses > 0
        ? (metrics.avgLossDollar ?? 0) * metrics.maxConsecutiveLosses
        : undefined,
      equityDrawdownPct: metrics.maxDrawdownPct,
      equityDrawdownDollar: Math.abs(metrics.maxDailyDrawdown),
      balanceDrawdownPct,
      balanceDrawdownDollar,
      avgRiskReward: clientMetrics.avgRiskReward ?? undefined,
      profitFactor: metrics.profitFactor,
      totalTrades: filtered.length,
      locale,
    });

    await setCachedInsight("risk", cacheParams, insights);
    await consumeCreditsAfterSuccess(user.id);
    return NextResponse.json(
      { insights },
      {
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
        },
      }
    );
  } catch (err) {
    console.error("[AI risk]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: msg.includes("OPENAI") ? "Configure OPENAI_API_KEY in .env.local" : msg },
      { status: 500 }
    );
  }
}

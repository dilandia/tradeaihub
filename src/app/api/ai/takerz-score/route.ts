import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTakerzScoreExplanation } from "@/lib/ai/agents/takerz-score-explanation";
import { getCachedInsight, setCachedInsight } from "@/lib/ai/cache";
import { checkAndConsumeAiCredits } from "@/lib/ai/plan-gate";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import {
  filterByDateRange,
  computeRadarMetricsWithRaw,
  computeZellaScore,
} from "@/lib/dashboard-calc";

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
        ? "Nenhum trade no período selecionado. Adicione ou importe trades para obter a explicação do Takerz Score."
        : "No trades in the selected period. Add or import trades to get the Takerz Score explanation.";
      return NextResponse.json({ insights: msg });
    }

    const cacheParams = { importId, accountId, period, locale };
    const cached = await getCachedInsight("takerz-score", cacheParams);
    if (cached) return NextResponse.json({ insights: cached, cached: true });

    const gate = await checkAndConsumeAiCredits(user.id);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, code: gate.code },
        { status: 403 }
      );
    }

    const { radar, raw } = computeRadarMetricsWithRaw(filtered, true);
    const zellaScore = computeZellaScore(radar);

    const insights = await generateTakerzScoreExplanation({
      radarMetrics: radar,
      rawValues: raw,
      zellaScore,
      totalTrades: filtered.length,
      locale,
    });

    await setCachedInsight("takerz-score", cacheParams, insights);
    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[AI takerz-score]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: msg.includes("OPENAI") ? "Configure OPENAI_API_KEY in .env.local" : msg },
      { status: 500 }
    );
  }
}

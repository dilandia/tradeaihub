import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import {
  filterByDateRange,
  buildPerformanceMetrics,
  computeClientMetrics,
} from "@/lib/dashboard-calc";
import { checkAiCopilotCredits, consumeCopilotCreditsAfterSuccess } from "@/lib/ai/plan-gate";
import { buildCopilotSystemPrompt } from "@/lib/ai/prompts/copilot";
import { chatCompletionStream } from "@/lib/ai/client";
import {
  createConversation,
  addMessage,
  getConversationMessages,
} from "@/lib/ai/copilot-conversations";
import type { CalendarTrade } from "@/lib/calendar-utils";

const MAX_HISTORY_MESSAGES = 10;

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
  const maxRiskPerTrade =
    lossAmounts.length > 0 ? Math.max(...lossAmounts) : metrics.largestLosingTrade;
  const stdLoss =
    lossAmounts.length > 1
      ? Math.sqrt(
          lossAmounts.reduce((s, v) => s + (v - avgRiskPerTrade) ** 2, 0) / lossAmounts.length
        )
      : 0;
  const cv = avgRiskPerTrade > 0 ? stdLoss / avgRiskPerTrade : 0;
  const riskConsistencyScore = Math.max(0, Math.min(100, Math.round(100 - cv * 50)));

  const clientMetrics = computeClientMetrics(filtered);
  return {
    totalTrades: metrics.totalTrades,
    wins: metrics.wins,
    losses: metrics.losses,
    winRate: metrics.winRate,
    netPnl: metrics.netPnl,
    netPips: clientMetrics.netPips !== 0 ? clientMetrics.netPips : undefined,
    profitFactor: metrics.profitFactor,
    avgWin: metrics.avgWinDollar,
    avgLoss: metrics.avgLossDollar,
    dayWinPct,
    maxDrawdown: metrics.maxDailyDrawdown,
    maxDrawdownPct: metrics.maxDrawdownPct,
    riskConsistencyScore,
    maxRiskPerTrade,
    avgRiskPerTrade,
    maxConsecutiveWins: metrics.maxConsecutiveWins,
    maxConsecutiveLosses: metrics.maxConsecutiveLosses,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      conversationId: existingConvId,
      importId,
      accountId,
      period = "all",
      locale = "en",
    } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gate = await checkAiCopilotCredits(user.id);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error, code: gate.code }, { status: 403 });
    }

    const trades = await getTrades(importId, accountId);
    const calendarTrades = toCalendarTrades(trades);
    const filtered = filterByDateRange(calendarTrades, period) as CalendarTrade[];

    if (filtered.length === 0) {
      const emptyMsg =
        locale?.startsWith("pt")
          ? "Você ainda não tem trades no período selecionado. Adicione ou importe trades para que eu possa analisar sua performance."
          : "You don't have any trades in the selected period yet. Add or import trades so I can analyze your performance.";
      return NextResponse.json({ content: emptyMsg });
    }

    const metrics = buildPerformanceMetrics(filtered, true);
    const copilotMetrics = buildCopilotMetrics(filtered, metrics);
    const systemPrompt = buildCopilotSystemPrompt(copilotMetrics, locale);

    let conversationId = existingConvId;
    const historyMessages: { role: "user" | "assistant"; content: string }[] = [];

    if (conversationId) {
      const msgs = await getConversationMessages(conversationId, user.id);
      const recent = msgs.slice(-MAX_HISTORY_MESSAGES * 2);
      for (const m of recent) {
        historyMessages.push({ role: m.role as "user" | "assistant", content: m.content });
      }
    } else {
      conversationId = await createConversation(user.id, importId, accountId);
    }

    const apiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...historyMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message.trim() },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = "";
          for await (const chunk of chatCompletionStream(apiMessages, { maxTokens: 1024 })) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();

          await addMessage(conversationId!, "user", message.trim(), user.id);
          await addMessage(conversationId!, "assistant", fullContent.trim(), user.id);
          await consumeCopilotCreditsAfterSuccess(user.id);
        } catch (err) {
          console.error("[AI Copilot stream]", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Conversation-Id": conversationId ?? "",
      },
    });
  } catch (err) {
    console.error("[AI Copilot]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: msg.includes("OPENAI") ? "Configure OPENAI_API_KEY in .env.local" : msg,
      },
      { status: 500 }
    );
  }
}

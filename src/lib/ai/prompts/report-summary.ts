export function buildReportSummaryPrompt(
  reportType: string,
  metrics: Record<string, unknown>,
  tradesSummary: { totalTrades: number; wins: number; netPnl: number; hasDollar: boolean },
  locale: string
): string {
  const lang = locale.startsWith("pt") ? "pt-BR" : "en";
  const instructions =
    lang === "pt-BR"
      ? `Você é um analista de trading. Gere um resumo executivo em 2-3 frases.
IMPORTANTE: Responda EXCLUSIVAMENTE em português brasileiro. Todo o texto deve estar em português.
Inclua: 1) Principais métricas do período. 2) Um destaque (melhor par, pior dia, etc). 3) Uma recomendação concreta.
Seja direto e acionável. Use apenas os dados fornecidos, não invente números.

Ao final, SEMPRE adicione a seção "### Insight final" seguida de uma conclusão prática em 1 frase que destaque a ação mais importante para o trader.`
      : `You are a trading analyst. Generate an executive summary in 2-3 sentences.
IMPORTANT: Respond EXCLUSIVELY in English. All text must be in English.
Include: 1) Key metrics for the period. 2) One highlight (best pair, worst day, etc). 3) One concrete recommendation.
Be direct and actionable. Use only the data provided, do not invent numbers.

At the end, ALWAYS add a "### Final insight" section followed by a practical conclusion in 1 sentence that highlights the most important action for the trader.`;

  return `${instructions}

Report type: ${reportType}

Metrics (JSON):
${JSON.stringify(metrics, null, 2)}

Trades summary: ${tradesSummary.totalTrades} trades, ${tradesSummary.wins} wins, net PnL: ${tradesSummary.netPnl}${tradesSummary.hasDollar ? " (dollar)" : " (pips)"}

Generate the summary:`;
}

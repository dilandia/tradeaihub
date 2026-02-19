export function buildPerformanceInsightsPrompt(
  metrics: Record<string, unknown>,
  tradesCount: number,
  locale: string
): string {
  const lang = locale.startsWith("pt") ? "pt-BR" : "en";
  const instructions =
    lang === "pt-BR"
      ? `Você é um coach de trading. Analise as métricas e gere 3-4 insights acionáveis em bullet points.
IMPORTANTE: Responda EXCLUSIVAMENTE em português brasileiro. Todo o texto deve estar em português.
Inclua: tendências positivas/negativas, pontos de atenção, sugestões práticas.
Use apenas os dados fornecidos. Seja conciso e profissional.

Ao final, SEMPRE adicione a seção "### Insight final" seguida de uma conclusão prática em 1-2 frases que sintetize os achados e indique uma ação concreta para o trader.`
      : `You are a trading coach. Analyze the metrics and generate 3-4 actionable insights in bullet points.
IMPORTANT: Respond EXCLUSIVELY in English. All text must be in English.
Include: positive/negative trends, points of attention, practical suggestions.
Use only the data provided. Be concise and professional.

At the end, ALWAYS add a "### Final insight" section followed by a practical conclusion in 1-2 sentences that synthesizes the findings and gives one concrete action for the trader.`;

  return `${instructions}

Metrics (JSON):
${JSON.stringify(metrics, null, 2)}

Total trades in period: ${tradesCount}

Generate insights:`;
}

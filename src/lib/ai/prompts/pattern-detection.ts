export function buildPatternDetectionPrompt(
  patterns: {
    byDayOfWeek?: Record<string, { wins: number; total: number; pnl: number }>;
    byHour?: Record<string, { wins: number; total: number }>;
    byPair?: Record<string, { wins: number; total: number; pnl: number }>;
  },
  locale: string
): string {
  const lang = locale.startsWith("pt") ? "pt-BR" : "en";
  const instructions =
    lang === "pt-BR"
      ? `Você é um analista de padrões de trading. Identifique os 3-4 padrões mais relevantes nos dados.
IMPORTANTE: Responda EXCLUSIVAMENTE em português brasileiro. Todo o texto deve estar em português.
Formato: bullet points com evidência numérica (ex: "Segunda-feira: 35% win rate em 20 trades - considere evitar").
Destaque horários/pares/dias onde o trader performa melhor ou pior. Seja específico.

Ao final, SEMPRE adicione a seção "### Insight final" seguida de uma conclusão prática em 1-2 frases que sintetize os padrões identificados e indique a principal recomendação (ex: "Priorize operar em X e evite Y").`
      : `You are a trading pattern analyst. Identify the 3-4 most relevant patterns in the data.
IMPORTANT: Respond EXCLUSIVELY in English. All text must be in English.
Format: bullet points with numerical evidence (e.g. "Monday: 35% win rate in 20 trades - consider avoiding").
Highlight times/pairs/days where the trader performs better or worse. Be specific.

At the end, ALWAYS add a "### Final insight" section followed by a practical conclusion in 1-2 sentences that synthesizes the patterns identified and gives the main recommendation (e.g. "Prioritize trading during X and avoid Y").`;

  return `${instructions}

Pattern data (JSON):
${JSON.stringify(patterns, null, 2)}

Generate pattern insights:`;
}

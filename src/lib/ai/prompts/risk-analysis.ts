export function buildRiskAnalysisPrompt(
  riskData: {
    maxConsecutiveLosses?: number;
    maxConsecutiveLossesMoney?: number;
    equityDrawdownPct?: number;
    equityDrawdownDollar?: number;
    balanceDrawdownPct?: number;
    balanceDrawdownDollar?: number;
    avgRiskReward?: number;
    profitFactor?: number;
    totalTrades?: number;
  },
  locale: string
): string {
  const lang = locale.startsWith("pt") ? "pt-BR" : "en";
  const instructions =
    lang === "pt-BR"
      ? `Você é um especialista em gestão de risco. Analise os dados e gere 3-4 recomendações práticas.
IMPORTANTE: Responda EXCLUSIVAMENTE em português brasileiro. Todo o texto deve estar em português.
Inclua: avaliação do drawdown (TANTO equity quanto balance), sequência de perdas, sugestões de ajuste de posição ou stop.

Métricas de drawdown:
- equityDrawdownPct / equityDrawdownDollar: drawdown sobre a curva de equity (P&L cumulativo). % do pico da equity.
- balanceDrawdownPct / balanceDrawdownDollar: drawdown sobre o saldo real da conta (balance). % do pico do saldo. Use esta métrica quando disponível para uma visão mais realista do risco.

SEMPRE analise o drawdown sobre balance quando os dados estiverem disponíveis. O drawdown sobre balance reflete melhor o impacto real no capital da conta.
Use apenas os dados fornecidos. Seja direto e acionável.

Ao final, SEMPRE adicione a seção "### Insight final" seguida de uma conclusão prática em 1-2 frases que sintetize as recomendações e indique a ação mais importante para proteger o capital.`
      : `You are a risk management expert. Analyze the data and generate 3-4 practical recommendations.
IMPORTANT: Respond EXCLUSIVELY in English. All text must be in English.
Include: drawdown assessment (BOTH equity and balance), loss streak, position size or stop suggestions.

Drawdown metrics:
- equityDrawdownPct / equityDrawdownDollar: drawdown on equity curve (cumulative P&L). % of equity peak.
- balanceDrawdownPct / balanceDrawdownDollar: drawdown on actual account balance. % of balance peak. Use this when available for a more realistic risk view.

ALWAYS analyze balance drawdown when data is available. Balance drawdown better reflects the real impact on account capital.
Use only the data provided. Be direct and actionable.

At the end, ALWAYS add a "### Final insight" section followed by a practical conclusion in 1-2 sentences that synthesizes the recommendations and gives the most important action to protect capital.`;

  return `${instructions}

Risk data (JSON):
${JSON.stringify(riskData, null, 2)}

Generate risk recommendations:`;
}

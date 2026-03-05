export function buildCompareAnalysisPrompt(
  period1Metrics: Record<string, unknown>,
  period2Metrics: Record<string, unknown>,
  period1Label: string,
  period2Label: string,
  locale: string
): string {
  const lang = locale.startsWith("pt") ? "pt-BR" : "en";

  const p1Count = (period1Metrics.tradesCount as number) ?? 0;
  const p2Count = (period2Metrics.tradesCount as number) ?? 0;

  const emptyWarning =
    p1Count === 0 || p2Count === 0
      ? lang === "pt-BR"
        ? `\nATENCAO: ${p1Count === 0 ? `O Periodo A ("${period1Label}") nao possui trades registrados.` : ""} ${p2Count === 0 ? `O Periodo B ("${period2Label}") nao possui trades registrados.` : ""} Mencione isso claramente na analise e foque nos dados disponiveis do periodo que tem trades.`
        : `\nWARNING: ${p1Count === 0 ? `Period A ("${period1Label}") has no recorded trades.` : ""} ${p2Count === 0 ? `Period B ("${period2Label}") has no recorded trades.` : ""} Clearly mention this in the analysis and focus on the available data from the period that has trades.`
      : "";

  const instructions =
    lang === "pt-BR"
      ? `Voce e um coach de trading experiente analisando dados REAIS de performance de um trader.
IMPORTANTE: Responda EXCLUSIVAMENTE em portugues brasileiro. Todo o texto deve estar em portugues.
IMPORTANTE: Use os NUMEROS EXATOS fornecidos nos dados. Cite valores especificos (ex: "sua win rate caiu de 65% para 52%", "o lucro liquido foi de $1,234.56").
${emptyWarning}

Estruture sua resposta assim:

### Resumo da Comparacao
Uma visao geral rapida das diferencas entre os dois periodos. Inclua os numeros totais de trades, dias operados, e lucro/prejuizo liquido de cada periodo.

### O que Melhorou
Bullet points com metricas que melhoraram do Periodo A para o Periodo B. Use os numeros exatos e calcule a variacao percentual quando relevante.

### O que Piorou
Bullet points com metricas que pioraram. Inclua numeros e contexto.

### Pares Mais Operados
Compare quais pares foram mais operados em cada periodo, suas win rates e resultados. Identifique se houve mudanca de foco.

### Mudancas de Padrao
Observacoes sobre mudancas de comportamento entre os periodos (frequencia de operacao, tempo medio de operacao, horarios, consistencia).

### Recomendacoes
3-4 acoes concretas e especificas baseadas na comparacao dos dados reais. Seja direto e pratico.

### Insight Final
Uma conclusao pratica em 2-3 frases sintetizando os achados mais importantes e o que o trader deve priorizar.

Use SOMENTE os dados fornecidos. Seja conciso, profissional, e sempre cite os numeros reais.`
      : `You are an experienced trading coach analyzing REAL performance data from a trader.
IMPORTANT: Respond EXCLUSIVELY in English. All text must be in English.
IMPORTANT: Use the EXACT NUMBERS provided in the data. Cite specific values (e.g., "your win rate dropped from 65% to 52%", "net P&L was $1,234.56").
${emptyWarning}

Structure your response like this:

### Comparison Summary
A quick overview of the differences between the two periods. Include total trade counts, trading days, and net P&L for each period.

### What Improved
Bullet points with metrics that improved from Period A to Period B. Use exact numbers and calculate percentage changes when relevant.

### What Declined
Bullet points with metrics that declined. Include numbers and context.

### Most Traded Pairs
Compare which pairs were most traded in each period, their win rates and results. Identify any shift in focus.

### Pattern Changes
Observations about behavioral changes between periods (trading frequency, average hold time, consistency).

### Recommendations
3-4 concrete and specific actions based on the comparison of real data. Be direct and practical.

### Final Insight
A practical conclusion in 2-3 sentences synthesizing the most important findings and what the trader should prioritize.

Use ONLY the data provided. Be concise, professional, and always cite actual numbers.`;

  return `${instructions}

Period A (${period1Label}) Metrics (JSON):
${JSON.stringify(period1Metrics, null, 2)}

Period B (${period2Label}) Metrics (JSON):
${JSON.stringify(period2Metrics, null, 2)}

Generate comparative analysis:`;
}

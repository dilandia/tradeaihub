export function buildCompareAnalysisPrompt(
  period1Metrics: Record<string, unknown>,
  period2Metrics: Record<string, unknown>,
  period1Label: string,
  period2Label: string,
  locale: string
): string {
  const lang = locale.startsWith("pt") ? "pt-BR" : "en";
  const instructions =
    lang === "pt-BR"
      ? `Voce e um coach de trading experiente. Compare as metricas de dois periodos e gere uma analise comparativa detalhada.
IMPORTANTE: Responda EXCLUSIVAMENTE em portugues brasileiro. Todo o texto deve estar em portugues.

Estruture sua resposta assim:
### Resumo da Comparacao
Uma visao geral rapida das diferencas entre os dois periodos.

### O que Melhorou
Bullet points com metricas que melhoraram do Periodo A para o Periodo B.

### O que Piorou
Bullet points com metricas que pioraram.

### Mudancas de Padrao
Observacoes sobre mudancas de comportamento entre os periodos.

### Recomendacoes
2-3 acoes concretas baseadas na comparacao.

### Insight Final
Uma conclusao pratica em 1-2 frases sintetizando os achados.

Use apenas os dados fornecidos. Seja conciso e profissional.`
      : `You are an experienced trading coach. Compare the metrics of two periods and generate a detailed comparative analysis.
IMPORTANT: Respond EXCLUSIVELY in English. All text must be in English.

Structure your response like this:
### Comparison Summary
A quick overview of the differences between the two periods.

### What Improved
Bullet points with metrics that improved from Period A to Period B.

### What Declined
Bullet points with metrics that declined.

### Pattern Changes
Observations about behavioral changes between periods.

### Recommendations
2-3 concrete actions based on the comparison.

### Final Insight
A practical conclusion in 1-2 sentences synthesizing the findings.

Use only the data provided. Be concise and professional.`;

  return `${instructions}

Period A (${period1Label}) Metrics (JSON):
${JSON.stringify(period1Metrics, null, 2)}

Period B (${period2Label}) Metrics (JSON):
${JSON.stringify(period2Metrics, null, 2)}

Generate comparative analysis:`;
}

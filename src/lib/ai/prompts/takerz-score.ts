/**
 * Prompt para o agente de explicação do Takerz Score.
 * Baseado nas regras da página /takerz-score (zella-score-content.tsx).
 */

const TAKERZ_RULES = `
## Regras do Takerz Score (0 a 100)

O Takerz Score combina 6 métricas-chave, cada uma avaliada de 0 a 100 e ponderada:

### 1. Profit Factor (Peso: 25%)
- O que mede: Razão entre lucro bruto total e prejuízo bruto total.
- Por que importa: Um PF acima de 1 indica lucratividade; valores mais altos = melhor performance.
- Fórmula: Lucro Bruto Total / Prejuízo Bruto Total
- Faixas: ≥2.6→100 | 2.4-2.59→90-99 | 2.2-2.39→80-89 | 2.0-2.19→70-79 | 1.9-1.99→60-69 | 1.8-1.89→50-59 | <1.8→20

### 2. Average Win/Loss Ratio (Peso: 20%)
- O que mede: Tamanho médio dos trades vencedores vs perdedores.
- Por que importa: Ratio mais alto = gerenciamento de risco eficaz e lucratividade.
- Fórmula: Avg Win / Avg Loss
- Faixas: ≥2.6→100 | 2.4-2.59→90-99 | 2.2-2.39→80-89 | 2.0-2.19→70-79 | 1.9-1.99→60-69 | 1.8-1.89→50-59 | <1.8→20

### 3. Maximum Drawdown (Peso: 20%)
- O que mede: Maior queda no saldo a partir de um pico do P&L acumulado.
- Por que importa: Drawdowns menores = gestão de risco eficaz.
- Fórmula: Max DD% = (Maior Queda Pico-ao-Vale / P&L Acumulado Máx) × 100 | Score = 100 – Max DD%
- Faixas: 0% DD→100 | 10% DD→90 | 25% DD→75 | 50% DD→50 | 75% DD→25

### 4. Trade Win Percentage (Peso: 15%)
- O que mede: % de trades vencedores sobre o total.
- Por que importa: Consistência é chave para sucesso de longo prazo.
- Fórmula: (Win% / 60) × 100 — limitado a 100
- Faixas: ≥60%→100 | 50%→83 | 40%→67 | 30%→50 | 25%→42

### 5. Recovery Factor (Peso: 10%)
- O que mede: Capacidade de recuperação após drawdowns.
- Por que importa: RF mais alto = resiliência e capacidade de se recuperar.
- Fórmula: Lucro Líquido / Drawdown Máximo
- Faixas: ≥3.5→100 | 3.0-3.49→70-89 | 2.5-2.99→60-69 | 2.0-2.49→50-59 | 1.5-1.99→30-49 | 1.0-1.49→1-29 | <1.0→0

### 6. Consistency Score (Peso: 10%)
- O que mede: Variação no desempenho diário.
- Por que importa: Consistência indica hábitos estáveis e reduz decisões impulsivas.
- Fórmula: Se lucro médio < 0 → 0. Senão: (Desvio Padrão / Lucro Total) × 100 | Score = 100 – Resultado
- Faixas: Variação mínima→~100 | moderada→~60-80 | alta→~20-40 | prejuízo médio→0
`;

export type TakerzScoreInput = {
  /** Métricas normalizadas 0-100 (scores) */
  radarMetrics: {
    winRate: number;
    consistency: number;
    profitFactor: number;
    maxDrawdown: number;
    avgWinLoss: number;
    recoveryFactor: number;
  };
  /** Valores brutos para contexto */
  rawValues: {
    winPct: number;
    profitFactorRaw: number;
    avgWinLossRatio: number;
    maxDrawdownPct: number;
    recoveryFactorRaw: number;
  };
  zellaScore: number;
  totalTrades: number;
  locale?: string;
};

export function buildTakerzScorePrompt(input: TakerzScoreInput): string {
  const lang = input.locale?.startsWith("pt") ? "pt-BR" : "en";

  const instructions =
    lang === "pt-BR"
      ? `Você é um especialista no Takerz Score. Sua tarefa é explicar DETALHADAMENTE os números do trader com base nas regras oficiais do Takerz Score.

IMPORTANTE: Responda EXCLUSIVAMENTE em português brasileiro.

Use as regras abaixo para interpretar cada métrica. Para cada uma das 6 métricas (seja conciso para reservar espaço ao Insight final):
1. Explique o valor bruto e o que ele significa
2. Indique em qual faixa de score o trader está
3. Destaque pontos fortes e fracos
4. Dê uma sugestão prática de melhoria quando aplicável

Ao final, SEMPRE adicione a seção "### Insight final" com:
1. Uma conclusão prática que sintetize o desempenho geral e a principal recomendação.
2. OBRIGATÓRIO: Justifique a nota média (Takerz Score geral) que aparece no card da página inicial. Explique como o score ${input.zellaScore}/100 foi obtido a partir da média ponderada das 6 métricas (Profit Factor 25%, Avg Win/Loss 20%, Max Drawdown 20%, Win % 15%, Recovery Factor 10%, Consistência 10%) e o que essa nota significa para o trader.

CRÍTICO: A seção "Insight final" deve ser SEMPRE concluída por completo, incluindo a justificativa da nota média. Nunca termine a resposta no meio de uma frase.`
      : `You are a Takerz Score expert. Your task is to explain IN DETAIL the trader's numbers based on the official Takerz Score rules.

IMPORTANT: Respond EXCLUSIVELY in English.

Use the rules below to interpret each metric. For each of the 6 metrics (be concise to reserve space for the Final insight):
1. Explain the raw value and what it means
2. Indicate which score range the trader is in
3. Highlight strengths and weaknesses
4. Give a practical improvement suggestion when applicable

At the end, ALWAYS add a "### Final insight" section with:
1. A practical conclusion that synthesizes overall performance and the main recommendation.
2. MANDATORY: Justify the average score (Takerz Score) shown on the homepage card. Explain how the score ${input.zellaScore}/100 was obtained from the weighted average of the 6 metrics (Profit Factor 25%, Avg Win/Loss 20%, Max Drawdown 20%, Win % 15%, Recovery Factor 10%, Consistency 10%) and what this score means for the trader.

CRITICAL: The "Final insight" section must ALWAYS be fully completed, including the average score justification. Never end the response mid-sentence.`;

  return `${instructions}

${TAKERZ_RULES}

## Dados do trader

- **Takerz Score geral:** ${input.zellaScore}/100
- **Total de trades:** ${input.totalTrades}

### Métricas (score 0-100 e valor bruto)

| Métrica | Score | Valor bruto |
|---------|-------|-------------|
| Win % | ${input.radarMetrics.winRate} | ${input.rawValues.winPct.toFixed(1)}% |
| Profit Factor | ${input.radarMetrics.profitFactor} | ${input.rawValues.profitFactorRaw.toFixed(2)} |
| Avg Win/Loss | ${input.radarMetrics.avgWinLoss} | ${input.rawValues.avgWinLossRatio.toFixed(2)} |
| Max Drawdown | ${input.radarMetrics.maxDrawdown} | ${input.rawValues.maxDrawdownPct.toFixed(1)}% DD |
| Recovery Factor | ${input.radarMetrics.recoveryFactor} | ${input.rawValues.recoveryFactorRaw.toFixed(2)} |
| Consistency | ${input.radarMetrics.consistency} | (variação diária) |

Gere a explicação detalhada:`;
}

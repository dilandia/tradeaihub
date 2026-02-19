/**
 * Sugestões contextuais baseadas em métricas fracas.
 * Retorna perguntas relevantes quando o usuário tem áreas de melhoria.
 */

export type SuggestionInput = {
  riskConsistencyScore?: number;
  winRate: number;
  maxConsecutiveLosses: number;
  dayWinPct?: number;
  profitFactor: number;
  totalTrades: number;
};

export type ContextualSuggestion = {
  queryKey: string;
  reasonKey: string;
  priority: number;
};

/** Gera sugestões baseadas em métricas fracas (prioridade maior = mais relevante) */
export function getContextualSuggestions(metrics: SuggestionInput): ContextualSuggestion[] {
  const suggestions: ContextualSuggestion[] = [];

  if (metrics.riskConsistencyScore != null && metrics.riskConsistencyScore < 50) {
    suggestions.push({
      queryKey: "riskConsistency",
      reasonKey: "riskConsistencyLow",
      priority: 10,
    });
  }

  if (metrics.winRate < 50 && metrics.totalTrades >= 10) {
    suggestions.push({
      queryKey: "improve",
      reasonKey: "winRateLow",
      priority: 9,
    });
  }

  if (metrics.maxConsecutiveLosses >= 5) {
    suggestions.push({
      queryKey: "riskConsistency",
      reasonKey: "consecutiveLossesHigh",
      priority: 8,
    });
  }

  if (metrics.dayWinPct != null && metrics.dayWinPct < 50) {
    suggestions.push({
      queryKey: "bestWorstDay",
      reasonKey: "dayWinLow",
      priority: 7,
    });
  }

  if (metrics.profitFactor < 1.2 && metrics.totalTrades >= 5) {
    suggestions.push({
      queryKey: "performanceSummary",
      reasonKey: "profitFactorLow",
      priority: 6,
    });
  }

  if (metrics.totalTrades >= 50) {
    suggestions.push({
      queryKey: "overtrading",
      reasonKey: "manyTrades",
      priority: 5,
    });
  }

  suggestions.push(
    { queryKey: "performanceSummary", reasonKey: "general", priority: 1 },
    { queryKey: "winRateConsistency", reasonKey: "general", priority: 0 }
  );

  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .filter((s, i, arr) => {
      const first = arr.findIndex((x) => x.queryKey === s.queryKey);
      return first === i;
    })
    .slice(0, 6);
}

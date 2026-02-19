/**
 * Registro de widgets - grid estilo TradeZella.
 *
 * Layout:
 * - KPIs (placement: "any"): grid de 4 cols separado no topo
 * - Main (placement: "main"): grid de 3 cols para charts/tabelas/calendários
 *
 * sqm (grid principal de 3 cols):
 * - 2: 1 coluna (widget padrão)
 * - 4: 2 colunas (calendário grande)
 * - 12: 3 colunas (full width)
 *
 * gridRows: quantas linhas o widget ocupa no grid principal (default: 1)
 */

export type WidgetSize = "sm" | "md" | "lg" | "xl" | "full";
export type WidgetGroup = "kpi" | "chart" | "table" | "calendar";
export type WidgetPlacement = "any" | "main";

export type WidgetDef = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  group: WidgetGroup;
  size: WidgetSize;
  /** Colunas no grid principal (2=1col, 4=2col, 12=full) */
  sqm: 1 | 2 | 4 | 12;
  /** "any" = top row + grid, "main" = apenas grid principal */
  placement: WidgetPlacement;
  /** Linhas que o widget ocupa no grid principal (default: 1) */
  gridRows?: number;
  toggleable: boolean;
};

/** 8 KPIs fixos no topo — Drawdown médio e Max drawdown ficam ocultos por padrão (usuário adiciona/troca) */
export const TOP_ROW_WIDGET_IDS = [
  "net-pnl",
  "win-rate",
  "profit-factor",
  "day-win-rate",
  "account-balance-pnl",
  "avg-win-loss",
  "trade-expectancy",
  "current-streak",
] as const;

export const WIDGET_REGISTRY: WidgetDef[] = [
  /* ─── KPIs pequenos (placement: "any" → top row) ─── */
  { id: "net-pnl",             labelKey: "widgets.netPnl",             descriptionKey: "widgets.netPnlDesc",             group: "kpi", size: "sm", sqm: 2, placement: "any",  toggleable: true },
  { id: "win-rate",            labelKey: "widgets.winRate",            descriptionKey: "widgets.winRateDesc",            group: "kpi", size: "sm", sqm: 2, placement: "any",  toggleable: true },
  { id: "profit-factor",       labelKey: "widgets.profitFactor",       descriptionKey: "widgets.profitFactorDesc",       group: "kpi", size: "sm", sqm: 2, placement: "any",  toggleable: true },
  { id: "day-win-rate",        labelKey: "widgets.dayWinRate",        descriptionKey: "widgets.dayWinRateDesc",         group: "kpi", size: "sm", sqm: 2, placement: "any",  toggleable: true },
  { id: "account-balance-pnl", labelKey: "widgets.accountBalancePnl", descriptionKey: "widgets.accountBalancePnlDesc",   group: "kpi", size: "sm", sqm: 2, placement: "any",  toggleable: true },
  { id: "avg-win-loss",        labelKey: "widgets.avgWinLoss",        descriptionKey: "widgets.avgWinLossDesc",        group: "kpi", size: "sm", sqm: 2, placement: "any",  toggleable: true },
  { id: "trade-expectancy",    labelKey: "widgets.tradeExpectancy",     descriptionKey: "widgets.tradeExpectancyDesc",    group: "kpi", size: "sm", sqm: 2, placement: "any",  toggleable: true },
  { id: "current-streak",      labelKey: "widgets.currentStreak",     descriptionKey: "widgets.currentStreakDesc",      group: "kpi", size: "sm", sqm: 2, placement: "any",  toggleable: true },
  { id: "max-drawdown",        labelKey: "widgets.maxDrawdown",        descriptionKey: "widgets.maxDrawdownDesc",        group: "kpi", size: "sm", sqm: 2, placement: "any",  toggleable: true },
  { id: "avg-drawdown",        labelKey: "widgets.avgDrawdown",       descriptionKey: "widgets.avgDrawdownDesc",         group: "kpi", size: "sm", sqm: 2, placement: "any",  toggleable: true },

  /* ─── Charts (grid principal 3 cols, 1 row cada) ─── */
  { id: "cumulative-pnl",   labelKey: "widgets.cumulativePnl",   descriptionKey: "widgets.cumulativePnlDesc",   group: "chart",    size: "md", sqm: 2,  placement: "main", toggleable: true },
  { id: "zella-radar",      labelKey: "widgets.zellaRadar",      descriptionKey: "widgets.zellaRadarDesc",      group: "chart",    size: "md", sqm: 2,  placement: "main", toggleable: true },
  { id: "net-daily-pnl",    labelKey: "widgets.netDailyPnl",     descriptionKey: "widgets.netDailyPnlDesc",    group: "chart",    size: "md", sqm: 2,  placement: "main", toggleable: true },

  /* ─── Calendário grande: 2 cols, 2 rows ─── */
  { id: "calendar-heatmap", labelKey: "widgets.calendarHeatmap",  descriptionKey: "widgets.calendarHeatmapDesc", group: "calendar", size: "lg", sqm: 4,  placement: "main", gridRows: 2, toggleable: true },

  /* ─── Recent trades: 1 col, 2 rows (fica ao lado do calendário) ─── */
  { id: "recent-trades",    labelKey: "widgets.recentTrades",     descriptionKey: "widgets.recentTradesDesc",    group: "table",    size: "md", sqm: 2,  placement: "main", gridRows: 2, toggleable: true },

  /* ─── Calendário mini: 1 col, 1 row ─── */
  { id: "calendar-mini",     labelKey: "widgets.calendarMini",    descriptionKey: "widgets.calendarMiniDesc",    group: "calendar", size: "md", sqm: 2,  placement: "main", toggleable: true },

  /* ─── Charts padrão (1 col, 1 row) ─── */
  { id: "account-balance",  labelKey: "widgets.accountBalance",  descriptionKey: "widgets.accountBalanceDesc",  group: "chart",    size: "md", sqm: 2,  placement: "main", toggleable: true },
  { id: "drawdown",         labelKey: "widgets.drawdown",         descriptionKey: "widgets.drawdownDesc",         group: "chart",    size: "md", sqm: 2,  placement: "main", toggleable: true },
  { id: "trade-time",       labelKey: "widgets.tradeTime",       descriptionKey: "widgets.tradeTimeDesc",       group: "chart",    size: "md", sqm: 2,  placement: "main", toggleable: true },
  { id: "trade-duration",   labelKey: "widgets.tradeDuration",   descriptionKey: "widgets.tradeDurationDesc",   group: "chart",    size: "md", sqm: 2,  placement: "main", toggleable: true },

  /* ─── Full width (3 cols no grid de 3) ─── */
  { id: "win-avg-line",     labelKey: "widgets.winAvgLine",      descriptionKey: "widgets.winAvgLineDesc",      group: "chart",    size: "full", sqm: 12, placement: "main", toggleable: true },
  { id: "yearly-calendar",  labelKey: "widgets.yearlyCalendar",  descriptionKey: "widgets.yearlyCalendarDesc",  group: "calendar", size: "full", sqm: 12, placement: "main", toggleable: true },
  { id: "report-metrics",   labelKey: "widgets.reportMetrics",   descriptionKey: "widgets.reportMetricsDesc",   group: "table",    size: "full", sqm: 12, placement: "main", toggleable: true },
];

export const DEFAULT_WIDGET_ORDER: string[] = [
  ...TOP_ROW_WIDGET_IDS,
  "max-drawdown",
  "avg-drawdown",
  "cumulative-pnl",
  "zella-radar",
  "net-daily-pnl",
  "recent-trades",
  "calendar-heatmap",
  "calendar-mini",
  "account-balance",
  "drawdown",
  "trade-time",
  "trade-duration",
  "win-avg-line",
  "yearly-calendar",
];
/** Ocultos por padrão: report-metrics (Reports), max-drawdown e avg-drawdown (usuário adiciona/troca no topo) */
export const DEFAULT_HIDDEN: string[] = ["report-metrics", "max-drawdown", "avg-drawdown"];

/**
 * Col span no grid principal de 3 colunas.
 */
export function getGridSpan(sqm: 1 | 2 | 4 | 12): { col: number } {
  switch (sqm) {
    case 1:  return { col: 1 };
    case 2:  return { col: 1 };
    case 4:  return { col: 2 };
    case 12: return { col: 3 };
    default: return { col: 1 };
  }
}

export function getWidgetDef(id: string): WidgetDef | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id);
}

export function isSmallWidget(id: string): boolean {
  const def = getWidgetDef(id);
  return def?.placement === "any";
}

export function isLargeWidget(id: string): boolean {
  const def = getWidgetDef(id);
  return def?.placement === "main";
}

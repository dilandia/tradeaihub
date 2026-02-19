/* ─── Widgets existentes ─── */
export { MetricCard } from "./metric-card";
export { WinRateGauge } from "./win-rate-gauge";
export { ProfitFactorGauge } from "./profit-factor-gauge";
export { AvgWinLossBar } from "./avg-win-loss-bar";
export { ZellaScoreHexagon } from "./zella-score-hexagon";
export { CalendarHeatmap } from "./calendar-heatmap";
export type { DayCell } from "@/lib/calendar-utils";
export { CumulativePnlChart } from "./cumulative-pnl-chart";
export type { PnlPoint } from "./cumulative-pnl-chart";
export { RecentTradesTable } from "./recent-trades-table";
export type { TradeRow } from "./recent-trades-table";
export { DashboardFilters } from "./dashboard-filters";

/* ─── Novos widgets ─── */
export { DayWinRate } from "./day-win-rate";
export { ZellaRadarChart } from "./zella-radar-chart";
export { NetDailyPnlChart } from "./net-daily-pnl-chart";
export { AccountBalanceChart } from "./account-balance-chart";
export { DrawdownChart } from "./drawdown-chart";
export { TradeTimeScatter } from "./trade-time-scatter";
export { TradeDurationScatter } from "./trade-duration-scatter";
export { WinAvgMultiLine } from "./win-avg-multi-line";
export { YearlyCalendar } from "./yearly-calendar";
export { DataSourceSelector } from "./data-source-selector";
export type { LinkedAccount, ImportReport, DataSourceSelection } from "./data-source-selector";
export { WidgetTooltip } from "./widget-tooltip";

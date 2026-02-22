"use client";

import { useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from "react";
import { useLanguage } from "@/contexts/language-context";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DateRangeButton,
  FiltersButton,
  DEFAULT_FILTERS,
  applyTradeFilters,
  type TradeFilters,
} from "@/components/dashboard/dashboard-filters";
import { ViewModeSelector } from "@/components/dashboard/view-mode-selector";
import { ReportMetricsPanel } from "@/components/dashboard/report-metrics-panel";
import { WidgetConfigurator } from "@/components/dashboard/widget-configurator";
import { DashboardCustomize } from "@/components/dashboard/dashboard-customize";
import { LayoutProfileSwitcher } from "@/components/dashboard/layout-profile-switcher";
import { useWidgetPreferences } from "@/hooks/use-widget-preferences";
import { useLayoutProfiles } from "@/hooks/use-layout-profiles";
import { toast } from "sonner";
import {
  FileBarChart,
  BarChart3,
  Upload,
  Link2,
  ArrowRight,
  Filter,
  Settings2,
} from "lucide-react";
import NextLink from "next/link";

/* ─── Widgets ─── */
import { MetricCard } from "./metric-card";
import { WinRateGauge } from "./win-rate-gauge";
import { ProfitFactorGauge } from "./profit-factor-gauge";
import { AvgWinLossBar } from "./avg-win-loss-bar";
import { CalendarHeatmap } from "./calendar-heatmap";
import { CalendarMini } from "./calendar-mini";
import { DayDetailModal } from "./day-detail-modal";
import { CumulativePnlChart } from "./cumulative-pnl-chart";
import { RecentTradesTable } from "./recent-trades-table";
import { DayWinRateCompact } from "./day-win-rate-compact";
import { ZellaRadarChart } from "./zella-radar-chart";
import { NetDailyPnlChart } from "./net-daily-pnl-chart";
import { AccountBalanceChart } from "./account-balance-chart";
import { DrawdownChart } from "./drawdown-chart";
import { TradeTimeScatter } from "./trade-time-scatter";
import { TradeDurationScatter } from "./trade-duration-scatter";
import { WinAvgMultiLine } from "./win-avg-multi-line";
import { YearlyCalendar } from "./yearly-calendar";
import { DashboardGrid } from "./dashboard-grid";
import { AccountBalancePnl } from "./account-balance-pnl";
import { CurrentStreakCombined } from "./current-streak-combined";
import { TutorialChecklist } from "@/components/onboarding/tutorial-checklist";
import { DashboardAiFooter } from "@/components/dashboard/dashboard-ai-footer";

/* ─── Cálculos ─── */
import {
  buildCalendarDataFromTrades,
  filterTradesForDay,
} from "@/lib/calendar-utils";
import {
  computeClientMetrics,
  filterByDateRange,
  computeDayWinRate,
  computeRadarMetrics,
  computeCurrentStreaks,
  buildPerformanceMetrics,
  buildNetDailyPnl,
  buildAccountBalance,
  buildDrawdown,
  buildTradeTimePerformance,
  buildTradeDurationPerformance,
  buildWinAvgTimeSeries,
  buildYearlyCalendar,
} from "@/lib/dashboard-calc";

/* ─── Types ─── */
import type { ViewMode } from "./view-mode-selector";
import type { PnlPoint } from "./cumulative-pnl-chart";
import type { DayCell, CalendarTrade } from "@/lib/calendar-utils";
import type { ReportMetrics } from "./report-metrics-panel";
import type {
  DashboardMetrics,
  EquityCurvePoint,
  DrawdownAnalysis,
} from "@/app/actions/dashboard";

type Props = {
  calendarTrades: CalendarTrade[];
  pnlPoints: PnlPoint[];
  reportMetrics: ReportMetrics | null;
  hasAnySource: boolean;
  /** Saldo inicial para cálculo de ROI % (derivado do relatório quando disponível) */
  initialBalance?: number | null;
  /** Saldo atual da conta (para Account Balance & P&L) */
  currentAccountBalance?: number | null;
  /** Quando true, exibe dados demonstrativos e banner para novos usuários */
  isDemoMode?: boolean;
  /** W2-03: Pre-aggregated metrics from server RPC (used when no client filters active) */
  serverMetrics?: DashboardMetrics | null;
  /** W2-03: Pre-aggregated equity curve from server RPC */
  serverEquityCurve?: EquityCurvePoint[] | null;
  /** W2-03 + W3-03: Pre-aggregated drawdown analysis from server RPC.
   *  Consumed: maxDrawdownValue, maxDrawdownPct, recoveryDays (max-drawdown widget),
   *  currentStreak, maxConsecutiveWins, maxConsecutiveLosses (current-streak widget). */
  serverDrawdown?: DrawdownAnalysis | null;
};

/* ─── Formatters ─── */
const H = "•••";
const fmtDollar = (v: number) =>
  `${v >= 0 ? "+" : ""}$${Math.abs(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const fmtPips = (v: number) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(1)} pips`;

function fmtPnl(
  pipsVal: number,
  dollarVal: number,
  pctVal: number | null,
  m: ViewMode
): string {
  if (m === "privacy") return H;
  if (m === "dollar") return fmtDollar(dollarVal);
  if (m === "percentage") {
    if (pctVal == null) return "—";
    return `${pctVal >= 0 ? "+" : ""}${pctVal.toFixed(2)}%`;
  }
  return fmtPips(pipsVal);
}

function fmtAvg(
  pipsVal: number,
  dollarVal: number,
  pctVal: number | null,
  m: ViewMode
): string {
  if (m === "privacy") return H;
  if (m === "dollar")
    return `$${Math.abs(dollarVal).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  if (m === "percentage") {
    if (pctVal == null) return "—";
    return `${Math.abs(pctVal).toFixed(2)}%`;
  }
  return `${Math.abs(pipsVal).toFixed(1)} pips`;
}


function unitLabel(m: ViewMode): string {
  if (m === "dollar") return "$";
  if (m === "percentage") return "%";
  return "pips";
}


/* ═══════════════════════════════════════════════
 * Main Dashboard Component
 * ═══════════════════════════════════════════════ */

export function DashboardContent({
  calendarTrades,
  pnlPoints,
  reportMetrics,
  hasAnySource,
  initialBalance = null,
  currentAccountBalance = null,
  isDemoMode = false,
  serverMetrics = null,
  serverEquityCurve = null,
  serverDrawdown = null,
}: Props) {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("dollar");
  const [dateRange, setDateRange] = useState("all");
  const [tradeFilters, setTradeFilters] = useState<TradeFilters>(DEFAULT_FILTERS);
  const privacy = viewMode === "privacy";
  const { prefs, isVisible, toggleWidget, reorder, resetToDefaults, savePrefs } =
    useWidgetPreferences();
  const layoutProfiles = useLayoutProfiles();
  const [customizeMode, setCustomizeMode] = useState(false);
  const insightsSectionRef = useRef<HTMLDivElement>(null);
  const [insightsSectionVisible, setInsightsSectionVisible] = useState(false);

  useEffect(() => {
    const el = insightsSectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInsightsSectionVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: "0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pnlLabel = (m: ViewMode): string => {
    if (m === "dollar") return t("dashboard.netPnlDollar");
    if (m === "percentage") return t("dashboard.netPnlPct");
    return t("dashboard.netPnlPips");
  };

  /* ─── Calendar state ─── */
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDayData, setSelectedDayData] = useState<DayCell | null>(
    null
  );

  /* ─── Derived state ─── */
  const useDollar = viewMode === "dollar";
  const usePercentage = viewMode === "percentage";
  const unit = unitLabel(viewMode);

  /* ═══════════════════════════════════════════════
   * FILTROS: aplicar date range + trade filters
   * ═══════════════════════════════════════════════ */

  const filteredTrades = useMemo(() => {
    let out = filterByDateRange(calendarTrades, dateRange);
    out = applyTradeFilters(out, tradeFilters);
    return out;
  }, [calendarTrades, dateRange, tradeFilters]);

  /* ─── W2-03: Use server-side RPC data when no client filters are active ─── */
  const noFiltersActive =
    dateRange === "all" &&
    tradeFilters.pairs.length === 0 &&
    tradeFilters.result === "all";
  const useServerData = noFiltersActive && serverMetrics != null;

  /* ─── Métricas: prefer server RPC when available, fallback to client computation ─── */
  const clientMetrics = useMemo(
    () => computeClientMetrics(filteredTrades),
    [filteredTrades]
  );
  const metrics = useServerData ? serverMetrics : clientMetrics;

  /* ─── RecentTrades derivados dos filtrados ─── */
  const recentTrades = useMemo(() => {
    return filteredTrades.slice(0, 20).map((t) => ({
      id: t.id,
      date: t.date.slice(5).replace("-", "/"),
      pair: t.pair,
      pips: t.pips,
      profitDollar: t.profit_dollar ?? null,
      rr: t.risk_reward ?? 0,
      win: t.is_win,
    }));
  }, [filteredTrades]);

  /* ─── Memoized computations (todos usam filteredTrades) ─── */
  const calendarData = useMemo(
    () =>
      buildCalendarDataFromTrades(
        filteredTrades,
        calYear,
        calMonth,
        useDollar
      ),
    [filteredTrades, calYear, calMonth, useDollar]
  );
  const dayTrades = useMemo(
    () =>
      selectedDay
        ? filterTradesForDay(filteredTrades, selectedDay)
        : [],
    [filteredTrades, selectedDay]
  );
  const dayWinRate = useMemo(
    () => computeDayWinRate(filteredTrades, useDollar),
    [filteredTrades, useDollar]
  );
  const performanceMetrics = useMemo(
    () => buildPerformanceMetrics(filteredTrades, useDollar),
    [filteredTrades, useDollar]
  );
  const clientCurrentStreaks = useMemo(
    () => computeCurrentStreaks(filteredTrades, useDollar),
    [filteredTrades, useDollar]
  );
  /* W2-03: Prefer serverDrawdown streak data when no client filters active */
  const currentStreaks = useServerData && serverDrawdown
    ? {
        tradeStreak: serverDrawdown.currentStreak,
        dayStreak: clientCurrentStreaks.dayStreak, // server RPC has no day streak; keep client
      }
    : clientCurrentStreaks;
  const radarMetrics = useMemo(
    () => computeRadarMetrics(filteredTrades, useDollar),
    [filteredTrades, useDollar]
  );
  const netDailyPnl = useMemo(() => {
    const useDollarForCalc = useDollar || usePercentage;
    const data = buildNetDailyPnl(filteredTrades, useDollarForCalc);
    if (usePercentage && initialBalance != null && initialBalance > 0) {
      return data.map((p) => ({
        ...p,
        pnl: (p.pnl / initialBalance) * 100,
      }));
    }
    return data;
  }, [filteredTrades, useDollar, usePercentage, initialBalance]);
  const accountBalance = useMemo(
    () => buildAccountBalance(filteredTrades, useDollar),
    [filteredTrades, useDollar]
  );
  const drawdownData = useMemo(
    () => buildDrawdown(filteredTrades, useDollar),
    [filteredTrades, useDollar]
  );
  const timePerf = useMemo(
    () => buildTradeTimePerformance(filteredTrades, useDollar),
    [filteredTrades, useDollar]
  );
  const durationPerf = useMemo(
    () => buildTradeDurationPerformance(filteredTrades, useDollar),
    [filteredTrades, useDollar]
  );
  const winAvgSeries = useMemo(
    () => buildWinAvgTimeSeries(filteredTrades, useDollar),
    [filteredTrades, useDollar]
  );
  const yearlyData = useMemo(
    () => buildYearlyCalendar(filteredTrades, useDollar),
    [filteredTrades, useDollar]
  );

  /* ─── Cumulative P&L: prefer server equity curve when no filters active ─── */
  const serverPnlPoints = useMemo((): PnlPoint[] | null => {
    // Only use server equity curve for dollar/percentage modes (server returns dollar by default)
    if (!useServerData || !serverEquityCurve || serverEquityCurve.length === 0) return null;
    if (!useDollar && !usePercentage) return null; // Server curve is dollar-based; pips mode needs client calc
    const points = serverEquityCurve.map((pt) => ({
      date: pt.date.slice(5), // "YYYY-MM-DD" -> "MM-DD"
      cumulative: pt.equity,
    }));
    if (usePercentage && initialBalance != null && initialBalance > 0) {
      return points.map((p) => ({
        ...p,
        cumulative: (p.cumulative / initialBalance) * 100,
      }));
    }
    return points;
  }, [useServerData, serverEquityCurve, useDollar, usePercentage, initialBalance]);

  const clientCumulativePnl = useMemo(() => {
    const byDate = new Map<string, number>();
    const useDollarForCalc = useDollar || usePercentage;
    for (const t of filteredTrades) {
      const val =
        useDollarForCalc && t.profit_dollar != null ? t.profit_dollar : t.pips;
      byDate.set(t.date, (byDate.get(t.date) ?? 0) + val);
    }
    const sorted = Array.from(byDate.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    let cum = 0;
    const points = sorted.map(([date, v]) => {
      cum += v;
      const dec = useDollarForCalc ? 2 : 1;
      const f = 10 ** dec;
      return {
        date: date.slice(5),
        cumulative: Math.round(cum * f) / f,
      };
    });
    if (usePercentage && initialBalance != null && initialBalance > 0) {
      return points.map((p) => ({
        ...p,
        cumulative: (p.cumulative / initialBalance) * 100,
      }));
    }
    return points;
  }, [filteredTrades, useDollar, usePercentage, initialBalance]);

  const cumulativePnl = serverPnlPoints ?? clientCumulativePnl;

  const handleMonthChange = useCallback((y: number, m: number) => {
    setCalYear(y);
    setCalMonth(m);
  }, []);
  const handleDayClick = useCallback(
    (d: string, data: DayCell | null) => {
      setSelectedDay(d);
      setSelectedDayData(data);
    },
    []
  );

  const hasData = metrics.totalTrades > 0;
  const netPct = initialBalance != null && initialBalance > 0
    ? (metrics.netDollar / initialBalance) * 100
    : null;
  const avgWinPct = initialBalance != null && initialBalance > 0
    ? (metrics.avgWinDollar / initialBalance) * 100
    : null;
  const avgLossPct = initialBalance != null && initialBalance > 0
    ? (metrics.avgLossDollar / initialBalance) * 100
    : null;

  const netPnlDisplay = hasData
    ? fmtPnl(metrics.netPips, metrics.netDollar, netPct, viewMode)
    : "—";
  const primaryNet = useDollar ? metrics.netDollar : usePercentage ? (netPct ?? 0) : metrics.netPips;
  const trend = primaryNet >= 0 ? "up" : "down";
  const variant = primaryNet >= 0 ? "profit" : "loss";

  /* ─── Filtros ativos info ─── */
  const totalTradesUnfiltered = calendarTrades.length;
  const isFiltered =
    dateRange !== "all" ||
    tradeFilters.pairs.length > 0 ||
    tradeFilters.result !== "all";

  /* ─── Render de cada widget ─── */
  function renderWidget(id: string): ReactNode {
      switch (id) {
        case "net-pnl":
          return (
            <MetricCard
              title={pnlLabel(viewMode)}
              value={netPnlDisplay}
              subtitle={t("dashboard.tradesCount", { count: String(metrics.totalTrades) })}
              icon={FileBarChart}
              trend={!privacy && hasData ? trend : undefined}
              variant={!privacy && hasData ? variant : "default"}
              tooltip={t("dashboard.netPnlTooltip")}
            />
          );
        case "account-balance-pnl":
          return (
            <AccountBalancePnl
              title={t("widgets.accountBalancePnl")}
              balance={
                currentAccountBalance ??
                (initialBalance != null ? initialBalance + metrics.netDollar : null)
              }
              pnlDisplay={netPnlDisplay}
              variant={!privacy && hasData ? variant : "default"}
              tooltip={t("dashboard.accountBalancePnlTooltip")}
              privacy={privacy}
            />
          );
        case "win-rate":
          return <WinRateGauge value={metrics.winRate} title={t("widgets.winRate")} tooltip={t("dashboard.winRateTooltip")} />;
        case "avg-win-loss":
          return (
            <AvgWinLossBar
              avgWin={
                privacy ? metrics.avgWinPips
                  : usePercentage ? avgWinPct : (useDollar ? metrics.avgWinDollar : metrics.avgWinPips)
              }
              avgLoss={
                privacy ? metrics.avgLossPips
                  : usePercentage ? avgLossPct : (useDollar ? metrics.avgLossDollar : metrics.avgLossPips)
              }
              format={(n) => {
                if (privacy) return `${Math.abs(n).toFixed(1)} pips`;
                if (viewMode === "dollar") return `$${Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                if (viewMode === "percentage") return `${Math.abs(n).toFixed(2)}%`;
                return `${Math.abs(n).toFixed(1)} pips`;
              }}
              tooltip={t("dashboard.avgWinLossTooltip")}
            />
          );
        case "profit-factor":
          return (
            <ProfitFactorGauge
              value={useDollar ? metrics.profitFactorDollar : metrics.profitFactor}
              title={t("widgets.profitFactor")}
              tooltip={t("dashboard.profitFactorTooltip")}
            />
          );
        case "day-win-rate":
          return (
            <DayWinRateCompact
              title={t("widgets.dayWinRate")}
              winDays={dayWinRate.winDays}
              lossDays={dayWinRate.lossDays}
              totalDays={dayWinRate.totalDays}
              dayWinPct={dayWinRate.dayWinPct}
              tooltip={t("dashboard.dayWinRateTooltip")}
            />
          );
        case "trade-expectancy":
          return (
            <MetricCard
              title={t("widgets.tradeExpectancy")}
              value={
                privacy
                  ? H
                  : fmtPnl(
                      0,
                      performanceMetrics.tradeExpectancy,
                      initialBalance != null && initialBalance > 0
                        ? (performanceMetrics.tradeExpectancy / initialBalance) * 100
                        : null,
                      viewMode
                    )
              }
              tooltip={t("widgets.tradeExpectancyDesc")}
              variant={
                !privacy && performanceMetrics.tradeExpectancy >= 0
                  ? "profit"
                  : !privacy && performanceMetrics.tradeExpectancy < 0
                    ? "loss"
                    : "default"
              }
            />
          );
        case "current-streak": {
          /* W3-03: Pass max consecutive wins/losses from server when available */
          const maxConsWins = useServerData && serverDrawdown
            ? serverDrawdown.maxConsecutiveWins
            : performanceMetrics.maxConsecutiveWins;
          const maxConsLosses = useServerData && serverDrawdown
            ? serverDrawdown.maxConsecutiveLosses
            : performanceMetrics.maxConsecutiveLosses;
          return (
            <CurrentStreakCombined
              title={t("widgets.currentStreak")}
              dayStreak={currentStreaks.dayStreak}
              tradeStreak={currentStreaks.tradeStreak}
              maxConsecutiveWins={maxConsWins}
              maxConsecutiveLosses={maxConsLosses}
              tooltip={t("widgets.currentStreakDesc")}
            />
          );
        }
        case "max-drawdown": {
          /* W2-03 + W3-03: Use server drawdown when available */
          const hasServerDD = useServerData && serverDrawdown;
          const maxDDValue = hasServerDD
            ? serverDrawdown.maxDrawdownValue
            : Math.abs(performanceMetrics.maxDailyDrawdown);
          const maxDDPct = hasServerDD ? serverDrawdown.maxDrawdownPct : null;
          const recoveryDays = hasServerDD ? serverDrawdown.recoveryDays : null;
          const ddSubtitle = !privacy && (maxDDPct != null || recoveryDays != null)
            ? [
                maxDDPct != null ? `${maxDDPct.toFixed(1)}%` : null,
                recoveryDays != null
                  ? recoveryDays === -1
                    ? t("widgets.stillInDrawdown")
                    : recoveryDays > 0
                      ? `${recoveryDays}d ${t("widgets.recovery")}`
                      : null
                  : null,
              ].filter(Boolean).join(" · ")
            : undefined;
          return (
            <MetricCard
              title={t("widgets.maxDrawdown")}
              value={
                privacy
                  ? H
                  : fmtPnl(0, maxDDValue, null, viewMode)
              }
              subtitle={ddSubtitle}
              tooltip={t("widgets.maxDrawdownDesc")}
              variant="loss"
            />
          );
        }
        case "avg-drawdown":
          // TODO Wave 3: serverDrawdown RPC does not include avg drawdown; stays client-computed
          return (
            <MetricCard
              title={t("widgets.avgDrawdown")}
              value={
                privacy
                  ? H
                  : fmtPnl(0, Math.abs(performanceMetrics.avgDailyDrawdown), null, viewMode)
              }
              tooltip={t("widgets.avgDrawdownDesc")}
              variant="loss"
            />
          );
        case "cumulative-pnl":
          return (
            <CumulativePnlChart
              data={
                cumulativePnl.length > 0
                  ? cumulativePnl
                  : usePercentage && initialBalance != null && initialBalance > 0
                    ? pnlPoints.map((p) => ({ ...p, cumulative: (p.cumulative / initialBalance) * 100 }))
                    : pnlPoints
              }
              privacy={privacy}
              unit={unit}
            />
          );
        case "zella-radar":
          return <ZellaRadarChart data={radarMetrics} privacy={privacy} />;
        case "net-daily-pnl":
          return <NetDailyPnlChart data={netDailyPnl} privacy={privacy} unit={unit} />;
        case "calendar-heatmap":
          return (
            <CalendarHeatmap
              year={calYear}
              month={calMonth}
              days={calendarData.days}
              weeks={calendarData.weeks}
              monthPnl={calendarData.monthPnl}
              monthTrades={calendarData.monthTrades}
              monthTradingDays={calendarData.monthTradingDays}
              privacy={privacy}
              unit={unit}
              onMonthChange={handleMonthChange}
              onDayClick={handleDayClick}
            />
          );
        case "calendar-mini":
          return (
            <CalendarMini
              year={calYear}
              month={calMonth}
              days={calendarData.days}
              monthPnl={calendarData.monthPnl}
              monthTrades={calendarData.monthTrades}
              monthTradingDays={calendarData.monthTradingDays}
              privacy={privacy}
              unit={unit}
              onMonthChange={handleMonthChange}
              onDayClick={handleDayClick}
            />
          );
        case "recent-trades":
          return (
            <RecentTradesTable
              trades={recentTrades}
              privacy={privacy}
              useDollar={useDollar}
            />
          );
        case "account-balance":
          return <AccountBalanceChart data={accountBalance} privacy={privacy} unit={unit} />;
        case "drawdown":
          return <DrawdownChart data={drawdownData} privacy={privacy} unit={unit} />;
        case "trade-time":
          return <TradeTimeScatter data={timePerf} privacy={privacy} unit={unit} />;
        case "trade-duration":
          return <TradeDurationScatter data={durationPerf} privacy={privacy} unit={unit} />;
        case "win-avg-line":
          return <WinAvgMultiLine data={winAvgSeries} privacy={privacy} unit={unit} />;
        case "yearly-calendar":
          return <YearlyCalendar data={yearlyData} privacy={privacy} unit={unit} />;
        case "report-metrics":
          return reportMetrics ? (
            <div className="h-full rounded-xl border border-border bg-card p-4 lg:p-6">
              <div className="mb-4 flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-score" />
                <h2 className="text-base font-semibold text-foreground">
                  {t("dashboard.mt5Metrics")}
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">
                  {t("dashboard.mt5MetricsDesc")}
                </span>
              </div>
              <ReportMetricsPanel data={reportMetrics} privacy={privacy} />
            </div>
          ) : null;
        default:
          return null;
      }
    }

  const allGridItems = prefs.order
    .filter(
      (id) =>
        isVisible(id) &&
        (id !== "report-metrics" || reportMetrics != null)
    )
    .map((id) => ({ id, children: renderWidget(id) }))
    .filter((item) => item.children != null);

  /* ─── Customize mode ─── */
  if (customizeMode) {
    return (
      <DashboardCustomize
        prefs={prefs}
        onSave={(newPrefs) => {
          savePrefs(newPrefs);
          setCustomizeMode(false);
          toast.success(t("customize.toastDashboardSaved"));
        }}
        onCancel={() => setCustomizeMode(false)}
        onApplyAndClose={(newPrefs) => {
          savePrefs(newPrefs);
          setCustomizeMode(false);
          toast.success(t("customize.toastLayoutApplied"));
        }}
        renderWidget={renderWidget}
        layoutProfiles={layoutProfiles}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Banner demonstrativo para novos usuários */}
      {isDemoMode && (
        <div className="border-b border-violet-500/30 bg-violet-500/10 px-4 py-3">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 text-center sm:justify-between sm:flex-nowrap sm:text-left">
            <p className="text-sm text-foreground">
              {t("dashboard.demoBanner")}
            </p>
            <NextLink
              href="/import"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              {t("import.importTrades")}
              <ArrowRight className="h-4 w-4" />
            </NextLink>
          </div>
        </div>
      )}
      {/* ═══════ TOOLBAR (filtros, view mode, widgets) ═══════ */}
      <div className="sticky top-14 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-2 px-4 lg:px-6">
          <span className="text-sm font-semibold text-foreground">{t("dashboard.title")}</span>
          <div className="flex-1" />
          <LayoutProfileSwitcher
            layoutProfiles={layoutProfiles}
            onApply={(order, hidden) => {
              savePrefs({ order, hidden });
              toast.success(t("customize.toastLayoutApplied"));
            }}
            onEditProfile={(index) => {
              const p = layoutProfiles.loadProfile(index);
              if (p) {
                savePrefs(p);
                setCustomizeMode(true);
              }
            }}
            onOpenCustomize={() => setCustomizeMode(true)}
          />
          <ViewModeSelector value={viewMode} onChange={setViewMode} />
          <FiltersButton
            trades={calendarTrades}
            filters={tradeFilters}
            onChange={setTradeFilters}
          />
          <DateRangeButton value={dateRange} onChange={setDateRange} />
          {/* Botão para entrar no modo personalização */}
          <button
            type="button"
            onClick={() => setCustomizeMode(true)}
            className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={t("widgets.customize")}
          >
            <Settings2 className="h-5 w-5" />
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* ═══════ CONTENT ═══════ */}
      <div className="p-4 lg:p-6 space-y-6">
        {/* ── Tutorial / Passo a passo ── */}
        <TutorialChecklist
          tradesCount={filteredTrades.length}
          onCustomizeClick={() => setCustomizeMode(true)}
        />

        {/* ── Filter info bar ── */}
        {isFiltered && totalTradesUnfiltered > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-2 text-xs text-muted-foreground">
            <span>
              {t("dashboard.showing")}{" "}
              <strong className="text-foreground">
                {filteredTrades.length}
              </strong>{" "}
              {t("dashboard.of")}{" "}
              <strong className="text-foreground">
                {totalTradesUnfiltered}
              </strong>{" "}
              {t("dashboard.trades")}
            </span>
            <button
              type="button"
              onClick={() => {
                setDateRange("all");
                setTradeFilters(DEFAULT_FILTERS);
              }}
              className="ml-auto text-xs text-score hover:text-score/80 transition-colors"
            >
              {t("dashboard.clearFilters")}
            </button>
          </div>
        )}

        {!hasData && totalTradesUnfiltered === 0 ? (
          /* ── Empty State (nenhum trade no total) ── */
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="mx-auto max-w-lg text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-score/10">
                <BarChart3 className="h-10 w-10 text-score" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {t("dashboard.noDataFound")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t("dashboard.addTradesDesc")}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <NextLink
                  href="/import"
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-score/50 hover:bg-card/80 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-profit/10 transition-colors group-hover:bg-profit/20">
                    <Upload className="h-6 w-6 text-profit" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("import.importTrades")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("import.importTradesDesc")}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-score transition-colors group-hover:text-score/80">
                    {t("import.goToImport")}{" "}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </NextLink>

                <NextLink
                  href="/settings/accounts"
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-score/50 hover:bg-card/80 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-score/10 transition-colors group-hover:bg-score/20">
                    <Link2 className="h-6 w-6 text-score" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("import.linkAccount")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("import.linkAccountDesc")}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-score transition-colors group-hover:text-score/80">
                    {t("import.manageAccounts")}{" "}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </NextLink>
              </div>
            </div>
          </div>
        ) : !hasData && totalTradesUnfiltered > 0 ? (
          /* ── Filtered to zero ── */
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="mx-auto max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {t("dashboard.noTradesFound")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("dashboard.filtersNoResults")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setDateRange("all");
                  setTradeFilters(DEFAULT_FILTERS);
                }}
                className="mt-4 rounded-lg bg-score px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-score/90"
              >
                {t("dashboard.clearFilters")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Insights IA: abaixo da linha do painel, acima dos widgets ── */}
            <div ref={insightsSectionRef}>
              <DashboardAiFooter />
            </div>
            {/* ── Dashboard: grid unificado ── */}
            <DashboardGrid items={allGridItems} />
          </>
        )}
      </div>

      {/* Day Detail Modal */}
      <DayDetailModal
        open={selectedDay != null}
        onClose={() => setSelectedDay(null)}
        date={selectedDay ?? ""}
        dayData={selectedDayData}
        trades={dayTrades}
        privacy={privacy}
      />
    </div>
  );
}

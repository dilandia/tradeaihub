import {
  getTrades,
  getImportSummaries,
  buildCumulativePnl,
  toCalendarTrades,
} from "@/lib/trades";
import { getUserTradingAccounts } from "@/lib/trading-accounts";
import {
  getDemoCalendarTrades,
  getDemoPnlPoints,
  getDemoReportMetrics,
  DEMO_INITIAL_BALANCE,
} from "@/lib/demo-data";
import {
  getCachedDashboardMetrics,
  getCachedEquityCurve,
  getCachedDrawdownAnalysis,
  getCachedDrawdownCurve,
} from "@/app/actions/dashboard";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; account?: string }>;
}) {
  const params = await searchParams;
  const selectedImportId = params.import ?? null;
  const selectedAccountId = params.account ?? null;

  // Get user ID for cache key isolation (RPCs read user from session internally)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const [summaries, trades, tradingAccounts, rpcMetrics, rpcEquityCurve, rpcDrawdown, rpcDrawdownCurve] =
    await Promise.all([
      getImportSummaries(),
      getTrades(selectedImportId, selectedAccountId),
      getUserTradingAccounts(),
      // W2-03: Parallel RPC calls for server-side aggregation
      userId
        ? getCachedDashboardMetrics(
            userId,
            selectedImportId ?? undefined,
            selectedAccountId ?? undefined
          ).catch((err) => {
            console.error("[dashboard] getCachedDashboardMetrics failed:", err);
            return null;
          })
        : Promise.resolve(null),
      userId
        ? getCachedEquityCurve(
            userId,
            "daily",
            selectedImportId ?? undefined,
            selectedAccountId ?? undefined
          ).catch((err) => {
            console.error("[dashboard] getCachedEquityCurve failed:", err);
            return null;
          })
        : Promise.resolve(null),
      userId
        ? getCachedDrawdownAnalysis(
            userId,
            selectedImportId ?? undefined,
            selectedAccountId ?? undefined
          ).catch((err) => {
            console.error("[dashboard] getCachedDrawdownAnalysis failed:", err);
            return null;
          })
        : Promise.resolve(null),
      // W3-05: Drawdown curve (daily points) for server-side chart rendering
      userId
        ? getCachedDrawdownCurve(
            userId,
            selectedImportId ?? undefined,
            selectedAccountId ?? undefined
          ).catch((err) => {
            console.error("[dashboard] getCachedDrawdownCurve failed:", err);
            return null;
          })
        : Promise.resolve(null),
    ]);

  const hasAnySource = tradingAccounts.length > 0 || summaries.length > 0;
  const useDemoData = trades.length === 0 && !hasAnySource;

  const calendarTrades = useDemoData
    ? getDemoCalendarTrades()
    : toCalendarTrades(trades);
  const pnlPoints = useDemoData
    ? getDemoPnlPoints()
    : buildCumulativePnl(trades);
  const pnlPointsFinal =
    pnlPoints.length > 0 ? pnlPoints : [{ date: "—", cumulative: 0 }];

  const activeSummary = selectedImportId
    ? summaries.find((s) => s.id === selectedImportId) ?? null
    : null;

  const initialBalance = useDemoData
    ? DEMO_INITIAL_BALANCE
    : activeSummary?.balance_drawdown_relative != null &&
        activeSummary?.balance_drawdown_relative_pct != null &&
        activeSummary.balance_drawdown_relative_pct > 0
      ? activeSummary.balance_drawdown_relative / (activeSummary.balance_drawdown_relative_pct / 100)
      : selectedAccountId
        ? (tradingAccounts.find((a) => a.id === selectedAccountId)?.balance ?? null)
        : null;

  const currentAccountBalance = selectedAccountId
    ? (tradingAccounts.find((a) => a.id === selectedAccountId)?.balance ?? null)
    : null;

  const reportMetrics = useDemoData
    ? getDemoReportMetrics()
    : activeSummary
      ? {
          totalNetProfit: activeSummary.total_net_profit,
          grossProfit: activeSummary.gross_profit,
          grossLoss: activeSummary.gross_loss,
          profitFactor: activeSummary.profit_factor,
          expectedPayoff: activeSummary.expected_payoff,
          recoveryFactor: activeSummary.recovery_factor,
          sharpeRatio: activeSummary.sharpe_ratio,
          drawdownAbsolute: activeSummary.balance_drawdown_absolute,
          drawdownMaximal: activeSummary.balance_drawdown_maximal,
          drawdownMaximalPct: activeSummary.balance_drawdown_maximal_pct,
          drawdownRelativePct: activeSummary.balance_drawdown_relative_pct,
          drawdownRelative: activeSummary.balance_drawdown_relative,
          totalTrades: activeSummary.total_trades,
          shortTrades: activeSummary.short_trades,
          shortTradesWonPct: activeSummary.short_trades_won_pct,
          longTrades: activeSummary.long_trades,
          longTradesWonPct: activeSummary.long_trades_won_pct,
          profitTrades: activeSummary.profit_trades,
          profitTradesPct: activeSummary.profit_trades_pct,
          lossTrades: activeSummary.loss_trades,
          lossTradesPct: activeSummary.loss_trades_pct,
          largestProfit: activeSummary.largest_profit_trade,
          largestLoss: activeSummary.largest_loss_trade,
          avgProfit: activeSummary.average_profit_trade,
          avgLoss: activeSummary.average_loss_trade,
          maxConsWins: activeSummary.max_consecutive_wins,
          maxConsWinsMoney: activeSummary.max_consecutive_wins_money,
          maxConsLosses: activeSummary.max_consecutive_losses,
          maxConsLossesMoney: activeSummary.max_consecutive_losses_money,
          accountName: activeSummary.account_name,
          broker: activeSummary.broker,
          importedCount: activeSummary.imported_trades_count,
        }
      : null;

  return (
    <DashboardContent
      calendarTrades={calendarTrades}
      pnlPoints={pnlPointsFinal}
      hasAnySource={hasAnySource}
      reportMetrics={reportMetrics}
      initialBalance={initialBalance}
      currentAccountBalance={currentAccountBalance}
      isDemoMode={useDemoData}
      serverMetrics={useDemoData ? null : rpcMetrics}
      serverEquityCurve={useDemoData ? null : rpcEquityCurve}
      serverDrawdown={useDemoData ? null : rpcDrawdown}
      serverDrawdownCurve={useDemoData ? null : rpcDrawdownCurve}
    />
  );
}

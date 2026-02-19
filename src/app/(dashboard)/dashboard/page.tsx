import {
  getTrades,
  getImportSummaries,
  buildCumulativePnl,
  toCalendarTrades,
} from "@/lib/trades";
import { getUserTradingAccounts } from "@/lib/trading-accounts";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; account?: string }>;
}) {
  const params = await searchParams;
  const selectedImportId = params.import ?? null;
  const selectedAccountId = params.account ?? null;

  const [summaries, trades, tradingAccounts] = await Promise.all([
    getImportSummaries(),
    getTrades(selectedImportId, selectedAccountId),
    getUserTradingAccounts(),
  ]);

  const pnlPoints = buildCumulativePnl(trades);
  const calendarTrades = toCalendarTrades(trades);
  const hasAnySource = tradingAccounts.length > 0 || summaries.length > 0;

  const activeSummary = selectedImportId
    ? summaries.find((s) => s.id === selectedImportId) ?? null
    : null;

  const initialBalance =
    activeSummary?.balance_drawdown_relative != null &&
    activeSummary?.balance_drawdown_relative_pct != null &&
    activeSummary.balance_drawdown_relative_pct > 0
      ? activeSummary.balance_drawdown_relative / (activeSummary.balance_drawdown_relative_pct / 100)
      : selectedAccountId
        ? (tradingAccounts.find((a) => a.id === selectedAccountId)?.balance ?? null)
        : null;

  const currentAccountBalance = selectedAccountId
    ? (tradingAccounts.find((a) => a.id === selectedAccountId)?.balance ?? null)
    : null;

  return (
    <DashboardContent
      calendarTrades={calendarTrades}
      pnlPoints={pnlPoints.length > 0 ? pnlPoints : [{ date: "—", cumulative: 0 }]}
      hasAnySource={hasAnySource}
      reportMetrics={activeSummary ? {
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
      } : null}
      initialBalance={initialBalance}
      currentAccountBalance={currentAccountBalance}
    />
  );
}

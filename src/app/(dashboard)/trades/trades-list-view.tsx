"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import type { Metrics, DbTrade } from "@/lib/trades";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { PaginationControls } from "@/components/pagination-controls";

interface TradesListViewProps {
  trades: DbTrade[];
  metrics: Metrics;
  importId: string | null;
  accountId: string | null;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

function buildTradesUrl(tradeId: string, importId: string | null, accountId: string | null) {
  const params = new URLSearchParams();
  params.set("tradeId", tradeId);
  if (importId) params.set("import", importId);
  if (accountId) params.set("account", accountId);
  return `/trades?${params.toString()}`;
}

export function TradesListView({ trades, metrics, importId, accountId, pagination }: TradesListViewProps) {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t("trades.netCumulativePnl")}
              </span>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "text-xl font-bold",
                  metrics.netDollar >= 0 ? "text-profit" : "text-loss"
                )}
              >
                {metrics.hasDollarData
                  ? `${metrics.netDollar >= 0 ? "+" : ""}$${metrics.netDollar.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `${metrics.netPips >= 0 ? "+" : ""}${metrics.netPips.toFixed(1)} pips`}
              </span>
              {metrics.netDollar >= 0 ? (
                <TrendingUp className="h-4 w-4 text-profit" />
              ) : (
                <TrendingDown className="h-4 w-4 text-loss" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t("trades.profitFactor")}
              </span>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-xl font-bold text-foreground">
              {metrics.profitFactorDollar > 0 ? metrics.profitFactorDollar.toFixed(2) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t("trades.tradeWinPct")}
              </span>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-xl font-bold text-foreground">
              {metrics.winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.wins}W / {metrics.losses}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t("trades.avgWinLossTrade")}
              </span>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-profit">
                {metrics.hasDollarData
                  ? `$${metrics.avgWinDollar.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
                  : `${metrics.avgWinPips.toFixed(1)} pips`}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium text-loss">
                {metrics.hasDollarData
                  ? `-$${Math.abs(metrics.avgLossDollar).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
                  : `-${Math.abs(metrics.avgLossPips).toFixed(1)} pips`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de trades */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t("trades.openDate")}</th>
                  <th className="px-4 py-3 font-medium">{t("trades.symbol")}</th>
                  <th className="px-4 py-3 font-medium">{t("trades.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("trades.closeDate")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("trades.entryPrice")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("trades.exitPrice")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("trades.netPnl")}</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      {t("trades.noTrades")}
                    </td>
                  </tr>
                ) : (
                  trades.map((row) => {
                    const pnl = row.profit_dollar != null ? Number(row.profit_dollar) : Number(row.pips);
                    const dateFmt = new Date(row.trade_date + "T00:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });
                    const url = buildTradesUrl(row.id, importId, accountId);
                    const goToTrade = () => router.push(url);
                    return (
                      <tr
                        key={row.id}
                        role="button"
                        tabIndex={0}
                        onClick={goToTrade}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            goToTrade();
                          }
                        }}
                        className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted active:bg-muted/80"
                      >
                        <td className="px-4 py-3 text-muted-foreground">{dateFmt}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{row.pair}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                              row.is_win ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
                            )}
                          >
                            {row.is_win ? "WIN" : "LOSS"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{dateFmt}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          ${Number(row.entry_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          ${Number(row.exit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                        </td>
                        <td className={cn("px-4 py-3 text-right font-medium", row.is_win ? "text-profit" : "text-loss")}>
                          {row.profit_dollar != null
                            ? `${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)} pips`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TDR-11: Pagination controls */}
          {pagination && (
            <PaginationControls
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalCount={pagination.totalCount}
              hasMore={pagination.hasMore}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { X, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { formatDate } from "@/lib/i18n/date-utils";
import { cn } from "@/lib/utils";
import type { DayCell, DayTradeDetail } from "@/lib/calendar-utils";

type Props = {
  open: boolean;
  onClose: () => void;
  date: string;
  dayData: DayCell | null;
  trades: DayTradeDetail[];
  privacy?: boolean;
};

function fmtPnl(val: number): string {
  const abs = Math.abs(val);
  const sign = val >= 0 ? "+" : "-";
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function StatBox({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-bold", className ?? "text-foreground")}>{value}</span>
    </div>
  );
}

export function DayDetailModal({ open, onClose, date, dayData, trades, privacy = false }: Props) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const importId = searchParams.get("import") ?? "";
  const accountId = searchParams.get("account") ?? "";
  const dayViewHref = [
    "/day-view",
    `?date=${date}`,
    importId ? `&import=${importId}` : "",
    accountId ? `&account=${accountId}` : "",
  ].join("");

  function goToTrade(tradeId: string) {
    onClose();
    const params = new URLSearchParams({ tradeId });
    if (importId) params.set("import", importId);
    if (accountId) params.set("account", accountId);
    router.push(`/trades?${params.toString()}`);
  }

  const formattedDate = formatDate(date, locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!open) return null;

  const pnl = dayData?.pnl ?? 0;
  const totalTrades = dayData?.tradesCount ?? 0;
  const wins = dayData?.wins ?? 0;
  const losses = dayData?.losses ?? 0;
  const winRate = dayData?.winRate ?? 0;
  const isProfit = pnl >= 0;

  const grossProfit = trades.filter((t) => t.is_win).reduce((s, t) => s + Math.abs(t.pips), 0);
  const grossLoss = trades.filter((t) => !t.is_win).reduce((s, t) => s + Math.abs(t.pips), 0);
  const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? 99 : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 m-auto flex max-h-[90vh] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">{formattedDate}</h2>
            <span className="text-sm font-medium text-muted-foreground">·</span>
            <span
              className={cn(
                "text-sm font-bold",
                isProfit ? "text-profit" : "text-loss"
              )}
            >
              Net P&L: {privacy ? "•••" : fmtPnl(pnl)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 border-b border-border px-5 py-4 sm:grid-cols-6">
          <StatBox label="Total Trades" value={String(totalTrades)} />
          <StatBox
            label="Gross P&L"
            value={privacy ? "•••" : fmtPnl(pnl)}
            className={isProfit ? "text-profit" : "text-loss"}
          />
          <StatBox label="Winners / Losers" value={`${wins} / ${losses}`} />
          <StatBox label="Win Rate" value={`${winRate}%`} />
          <StatBox label="Profit Factor" value={String(profitFactor)} />
          <StatBox
            label="Avg Pips"
            value={privacy ? "•••" : totalTrades > 0 ? (pnl / totalTrades).toFixed(1) : "0"}
          />
        </div>

        {/* Mini equity intraday */}
        {trades.length > 0 && (
          <div className="flex items-center gap-1 border-b border-border px-5 py-3">
            {(() => {
              let cum = 0;
              const points = trades.map((t) => { cum += t.pips; return cum; });
              const max = Math.max(...points.map(Math.abs), 1);
              return points.map((p, i) => (
                <div
                  key={trades[i].id}
                  className={cn(
                    "flex-1 rounded-sm transition-all",
                    p >= 0 ? "bg-profit/60" : "bg-loss/60"
                  )}
                  style={{ height: `${Math.max(4, (Math.abs(p) / max) * 32)}px` }}
                  title={privacy ? "•••" : `${trades[i].pair}: ${p >= 0 ? "+" : ""}${p.toFixed(1)} pips`}
                />
              ));
            })()}
          </div>
        )}

        {/* Trades Table */}
        <div className="flex-1 overflow-auto px-5 py-3">
          {trades.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum trade neste dia.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Hora</th>
                  <th className="pb-2 pr-3 font-medium">Par</th>
                  <th className="pb-2 pr-3 font-medium">Entrada</th>
                  <th className="pb-2 pr-3 font-medium">Saída</th>
                  <th className="pb-2 pr-3 font-medium">Pips</th>
                  <th className="pb-2 pr-3 font-medium">R:R</th>
                  <th className="pb-2 font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-border/30 transition-colors hover:bg-muted/20 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => goToTrade(trade.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToTrade(trade.id);
                      }
                    }}
                    title={t("trades.viewTrade")}
                  >
                    <td className="py-2.5 pr-3 text-foreground">{trade.time}</td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                        {trade.pair}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {privacy ? "•••" : trade.entry_price.toFixed(trade.entry_price > 100 ? 2 : 5)}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {privacy ? "•••" : trade.exit_price.toFixed(trade.exit_price > 100 ? 2 : 5)}
                    </td>
                    <td className={cn("py-2.5 pr-3 font-medium", trade.is_win ? "text-profit" : "text-loss")}>
                      {privacy ? "•••" : `${trade.pips >= 0 ? "+" : ""}${trade.pips.toFixed(1)}`}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {privacy ? "•••" : trade.risk_reward != null ? `${trade.risk_reward.toFixed(1)}R` : "—"}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          trade.is_win ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
                        )}
                      >
                        {trade.is_win ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {trade.is_win ? "Win" : "Loss"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <Link
            href={dayViewHref}
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg bg-score px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-score/90"
          >
            <ExternalLink className="h-4 w-4" />
            {t("dayView.viewDetails")}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </>
  );
}

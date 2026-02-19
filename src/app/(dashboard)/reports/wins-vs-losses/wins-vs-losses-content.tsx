"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "@/components/dashboard/widget-tooltip";
import { buildAccountBalance } from "@/lib/dashboard-calc";
import type { CalendarTrade } from "@/lib/calendar-utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Props = { trades: CalendarTrade[] };

function fmtPnl(v: number): string {
  return `${v >= 0 ? "+$" : "-$"}${Math.abs(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function WinsVsLossesContent({ trades }: Props) {
  const wins = useMemo(() => trades.filter((t) => t.is_win), [trades]);
  const losses = useMemo(() => trades.filter((t) => !t.is_win), [trades]);

  const winsCumulative = useMemo(
    () => buildAccountBalance(wins, true),
    [wins]
  );
  const lossesCumulative = useMemo(
    () => buildAccountBalance(losses, true),
    [losses]
  );

  const winsStats = useMemo(() => {
    const totalPnl = wins.reduce((s, t) => s + (t.profit_dollar ?? t.pips), 0);
    const byDate = new Map<string, number>();
    for (const t of wins) {
      byDate.set(t.date, (byDate.get(t.date) ?? 0) + 1);
    }
    const avgDailyVol =
      byDate.size > 0 ? wins.length / byDate.size : 0;
    const avgWin =
      wins.length > 0
        ? wins.reduce(
            (s, t) => s + Math.abs(t.profit_dollar ?? t.pips),
            0
          ) / wins.length
        : 0;
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    let maxConsec = 0;
    let cur = 0;
    for (const t of sorted) {
      cur = t.is_win ? cur + 1 : 0;
      if (cur > maxConsec) maxConsec = cur;
    }
    return {
      totalPnl,
      avgDailyVolume: avgDailyVol,
      avgWinningTrade: avgWin,
      winningTrades: wins.length,
      losingTrades: 0,
      commissions: 0,
      maxConsecutiveWins: maxConsec,
    };
  }, [wins, trades]);

  const lossesStats = useMemo(() => {
    const totalPnl = losses.reduce(
      (s, t) => s + (t.profit_dollar ?? t.pips),
      0
    );
    const byDate = new Map<string, number>();
    for (const t of losses) {
      byDate.set(t.date, (byDate.get(t.date) ?? 0) + 1);
    }
    const avgDailyVol =
      byDate.size > 0 ? losses.length / byDate.size : 0;
    const avgLoss =
      losses.length > 0
        ? losses.reduce(
            (s, t) => s + Math.abs(t.profit_dollar ?? t.pips),
            0
          ) / losses.length
        : 0;
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    let maxConsec = 0;
    let cur = 0;
    for (const t of sorted) {
      cur = !t.is_win ? cur + 1 : 0;
      if (cur > maxConsec) maxConsec = cur;
    }
    return {
      totalPnl,
      avgDailyVolume: avgDailyVol,
      avgWinningTrade: 0,
      avgLosingTrade: avgLoss,
      winningTrades: 0,
      losingTrades: losses.length,
      commissions: 0,
      maxConsecutiveLosses: maxConsec,
    };
  }, [losses, trades]);

  const empty = trades.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Wins vs Losses
        </h1>
        <p className="text-sm text-muted-foreground">
          Comparação de desempenho entre trades vencedores e perdedores.
        </p>
      </div>

      {empty && (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Não há trades que correspondam ao filtro atual.
            </p>
          </CardContent>
        </Card>
      )}

      {!empty && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* WINS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold text-profit">
                WINS ({wins.length} trades)
                <WidgetTooltip text="Estatísticas dos trades vencedores." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total P&L</span>
                  <p className="font-semibold text-profit">
                    {fmtPnl(winsStats.totalPnl)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg daily volume</span>
                  <p className="font-medium">
                    {winsStats.avgDailyVolume.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg winning trade</span>
                  <p className="font-medium text-profit">
                    {fmtPnl(winsStats.avgWinningTrade)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Winning trades</span>
                  <p className="font-medium">{winsStats.winningTrades}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Max consecutive wins</span>
                  <p className="font-medium">{winsStats.maxConsecutiveWins}</p>
                </div>
              </div>
              {winsCumulative.length > 0 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={winsCumulative.map((d) => ({
                        ...d,
                        cumulative: d.balance,
                      }))}
                      margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="winsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--profit)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--profit)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        stroke="var(--border)"
                      />
                      <YAxis
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        stroke="var(--border)"
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "0.5rem",
                        }}
                        formatter={(value: number) => [fmtPnl(value), "P&L"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="var(--profit)"
                        fill="url(#winsGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LOSSES */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold text-loss">
                LOSSES ({losses.length} trades)
                <WidgetTooltip text="Estatísticas dos trades perdedores." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total P&L</span>
                  <p className="font-semibold text-loss">
                    {fmtPnl(lossesStats.totalPnl)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg daily volume</span>
                  <p className="font-medium">
                    {lossesStats.avgDailyVolume.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg losing trade</span>
                  <p className="font-medium text-loss">
                    {fmtPnl(lossesStats.avgLosingTrade)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Losing trades</span>
                  <p className="font-medium">{lossesStats.losingTrades}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Max consecutive losses</span>
                  <p className="font-medium">{lossesStats.maxConsecutiveLosses}</p>
                </div>
              </div>
              {lossesCumulative.length > 0 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={lossesCumulative.map((d) => ({
                        ...d,
                        cumulative: d.balance,
                      }))}
                      margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--loss)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--loss)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        stroke="var(--border)"
                      />
                      <YAxis
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        stroke="var(--border)"
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "0.5rem",
                        }}
                        formatter={(value: number) => [fmtPnl(value), "P&L"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="var(--loss)"
                        fill="url(#lossGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { getMonthNamesShort } from "@/lib/i18n/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { WidgetTooltip } from "./widget-tooltip";
import { cn } from "@/lib/utils";
import type { YearlyRow } from "@/lib/dashboard-calc";

type Props = {
  data: YearlyRow[];
  privacy?: boolean;
  unit?: string;
};

function fmtPnl(val: number, unit: string): string {
  const abs = Math.abs(val);
  if (unit === "$") {
    if (abs >= 1000) return `${val >= 0 ? "" : "-"}$${(abs / 1000).toFixed(1)}K`;
    return `${val >= 0 ? "" : "-"}$${abs.toFixed(2)}`;
  }
  if (abs >= 1000) return `${val >= 0 ? "" : "-"}${(abs / 1000).toFixed(1)}K`;
  return `${val >= 0 ? "" : "-"}${abs.toFixed(1)}`;
}

export function YearlyCalendar({ data, privacy = false, unit = "pips" }: Props) {
  const { locale } = useLanguage();
  const monthLabels = useMemo(() => getMonthNamesShort(locale), [locale]);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-score" />
            <h3 className="text-sm font-semibold text-foreground">Calendário Anual</h3>
            <WidgetTooltip text="Visão anual do P&L por mês, com total de trades e resultado acumulado de cada período." />
          </div>
          <p className="py-8 text-center text-sm text-muted-foreground">Sem dados disponíveis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-score" />
          <h3 className="text-sm font-semibold text-foreground">Calendário Anual</h3>
          <WidgetTooltip text="Visão anual do P&L por mês, com total de trades e resultado acumulado de cada período." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Ano</th>
                {monthLabels.map((m, i) => (
                  <th key={`month-${i}`} className="px-1.5 py-2 text-center font-medium text-muted-foreground">{m}</th>
                ))}
                <th className="px-2 py-2 text-center font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.year} className="border-b border-border/30">
                  <td className="px-2 py-2 font-medium text-foreground">{row.year}</td>
                  {row.months.map((cell) => {
                    const hasTrades = cell.tradeCount > 0;
                    const isProfit = cell.pnl > 0;
                    const isLoss = cell.pnl < 0;

                    return (
                      <td key={cell.month} className="px-1 py-1">
                        <div
                          className={cn(
                            "flex flex-col items-center justify-center rounded-md px-1 py-1.5 text-center transition-colors",
                            hasTrades && isProfit && "bg-profit/15",
                            hasTrades && isLoss && "bg-loss/15",
                            hasTrades && !isProfit && !isLoss && "bg-muted/30",
                            !hasTrades && "bg-transparent"
                          )}
                        >
                          {hasTrades ? (
                            <>
                              <span
                                className={cn(
                                  "text-[11px] font-bold",
                                  isProfit ? "text-profit" : isLoss ? "text-loss" : "text-muted-foreground"
                                )}
                              >
                                {privacy ? "•••" : fmtPnl(cell.pnl, unit)}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {cell.tradeCount} trades
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {/* Total column */}
                  <td className="px-1 py-1">
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center rounded-md px-1 py-1.5 text-center",
                        row.totalTrades > 0 && row.totalPnl > 0 && "bg-profit/20",
                        row.totalTrades > 0 && row.totalPnl < 0 && "bg-loss/20",
                        row.totalTrades > 0 && row.totalPnl === 0 && "bg-muted/30"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[11px] font-bold",
                          row.totalPnl > 0 ? "text-profit" : row.totalPnl < 0 ? "text-loss" : "text-muted-foreground"
                        )}
                      >
                        {privacy ? "•••" : fmtPnl(row.totalPnl, unit)}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{row.totalTrades} trades</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

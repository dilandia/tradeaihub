"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { Tag, TrendingUp, TrendingDown } from "lucide-react";
import { WidgetTooltip } from "./widget-tooltip";

export interface TradeTagDetail {
  name: string;
  color: string;
  description: string | null;
}

export interface TradeRow {
  id: string;
  date: string;
  pair: string;
  pips: number;
  profitDollar: number | null;
  rr: number;
  win: boolean;
  tags?: string[];
  tag_details?: TradeTagDetail[];
}

interface RecentTradesTableProps {
  trades: TradeRow[];
  title?: string;
  className?: string;
  privacy?: boolean;
  useDollar?: boolean;
}

type TabId = "recent" | "open";

function fmtValue(t: TradeRow, useDollar: boolean): string {
  if (useDollar && t.profitDollar != null) {
    const v = t.profitDollar;
    const abs = Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return v >= 0 ? `$${abs}` : `-$${abs}`;
  }
  const v = t.pips;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)} pips`;
}

export function RecentTradesTable({
  trades,
  title,
  className,
  privacy = false,
  useDollar = true,
}: RecentTradesTableProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("recent");

  return (
    <Card className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        {/* Tabs */}
        <div className="flex shrink-0 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "recent"
                ? "border-b-2 border-score text-score"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("recentTrades.title")}
            <WidgetTooltip text={t("recentTrades.tooltip")} />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("open")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "open"
                ? "border-b-2 border-score text-score"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("recentTrades.openPositions")}
          </button>
        </div>

        {/* Tab Content — contido com scroll */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          {activeTab === "recent" ? (
            trades.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {title ?? t("recentTrades.noTrades")}
              </p>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2.5 pr-4 font-medium">{t("recentTrades.date")}</th>
                      <th className="pb-2.5 pr-4 font-medium">{t("recentTrades.symbol")}</th>
                      <th className="pb-2.5 pr-4 font-medium text-right">{t("recentTrades.netPnl")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-border/30 transition-colors hover:bg-muted/20"
                      >
                        <td className="py-2.5 pr-4 text-muted-foreground">{t.date}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{t.pair}</span>
                            {/* W2-P2: Show tag details with colors if available */}
                            {t.tag_details && t.tag_details.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {t.tag_details.map((tag) => (
                                  <span
                                    key={tag.name}
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
                                    style={{ backgroundColor: tag.color }}
                                    title={tag.description || tag.name}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            ) : t.tags && t.tags.length > 0 ? (
                              <Tag className="ml-1.5 inline h-3 w-3 text-muted-foreground" />
                            ) : null}
                          </div>
                        </td>
                        <td className={cn("py-2.5 text-right font-medium", t.win ? "text-profit" : "text-loss")}>
                          {privacy ? "•••" : fmtValue(t, useDollar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Open Positions tab */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/30">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("recentTrades.noOpenPositions")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {t("recentTrades.realtimeComing")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

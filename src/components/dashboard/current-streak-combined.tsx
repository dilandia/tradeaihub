"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, Zap, Trophy, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { WidgetTooltip } from "./widget-tooltip";

interface CurrentStreakCombinedProps {
  title: string;
  dayStreak: number;
  tradeStreak: number;
  maxConsecutiveWins?: number;
  maxConsecutiveLosses?: number;
  tooltip: string;
}

/**
 * Current Streak — combina Day e Trade + max consecutive wins/losses.
 */
export function CurrentStreakCombined({
  title,
  dayStreak,
  tradeStreak,
  maxConsecutiveWins,
  maxConsecutiveLosses,
  tooltip,
}: CurrentStreakCombinedProps) {
  const { t } = useLanguage();
  const dayVariant = dayStreak > 0 ? "profit" : dayStreak < 0 ? "loss" : "default";
  const tradeVariant = tradeStreak > 0 ? "profit" : tradeStreak < 0 ? "loss" : "default";

  const fmt = (v: number) => (v >= 0 ? `+${v}` : String(v));
  const hasMaxConsec = maxConsecutiveWins != null && maxConsecutiveLosses != null;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-3">
      <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-1.5 pt-0">
        <CardTitle className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {title}
          {tooltip && <WidgetTooltip text={tooltip} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col justify-center gap-2 pt-0">
        <div className="flex flex-wrap gap-2">
          {/* Day streak */}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2 py-1",
              dayVariant === "profit" && "border-profit/40 bg-profit/10",
              dayVariant === "loss" && "border-loss/40 bg-loss/10",
              dayVariant === "default" && "border-border/50 bg-muted/10"
            )}
          >
            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-[10px] font-medium text-muted-foreground">{t("widgets.streakDays")}</span>
            <span
              className={cn(
                "text-sm font-bold",
                dayVariant === "profit" && "text-profit",
                dayVariant === "loss" && "text-loss",
                dayVariant === "default" && "text-foreground"
              )}
            >
              {fmt(dayStreak)}
            </span>
          </div>
          {/* Trade streak */}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2 py-1",
              tradeVariant === "profit" && "border-profit/40 bg-profit/10",
              tradeVariant === "loss" && "border-loss/40 bg-loss/10",
              tradeVariant === "default" && "border-border/50 bg-muted/10"
            )}
          >
            <Zap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-[10px] font-medium text-muted-foreground">{t("widgets.streakTrades")}</span>
            <span
              className={cn(
                "text-sm font-bold",
                tradeVariant === "profit" && "text-profit",
                tradeVariant === "loss" && "text-loss",
                tradeVariant === "default" && "text-foreground"
              )}
            >
              {fmt(tradeStreak)}
            </span>
          </div>
        </div>
        {/* W3-03: Max consecutive wins/losses */}
        {hasMaxConsec && (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-profit/20 bg-profit/5 px-2 py-0.5">
              <Trophy className="h-3 w-3 shrink-0 text-profit/70" aria-hidden />
              <span className="text-[10px] text-muted-foreground">{t("widgets.maxWins")}</span>
              <span className="text-xs font-bold text-profit">{maxConsecutiveWins}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-loss/20 bg-loss/5 px-2 py-0.5">
              <XCircle className="h-3 w-3 shrink-0 text-loss/70" aria-hidden />
              <span className="text-[10px] text-muted-foreground">{t("widgets.maxLosses")}</span>
              <span className="text-xs font-bold text-loss">{maxConsecutiveLosses}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

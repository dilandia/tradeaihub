"use client";

import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatTimeWithUserTimezone } from "@/lib/timezone-utils";
import type { CalendarTrade } from "@/lib/calendar-utils";
import type { ColumnKey } from "./column-selector";
import type { Strategy } from "@/app/actions/strategies";
import type { UserTag } from "@/app/actions/tags";

type Props = {
  trades: CalendarTrade[];
  columns: ColumnKey[];
  strategies?: Strategy[];
  userTags?: UserTag[];
  userTimezone?: string;
  onEditTrade?: (trade: CalendarTrade) => void;
};

function fmtDuration(mins: number | null): string {
  if (mins == null) return "\u2014";
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h${m > 0 ? ` ${m}m` : ""}`;
}

function fmtMoney(val: number | null): string {
  if (val == null) return "\u2014";
  const abs = Math.abs(val);
  if (val >= 0) return `$${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `-$${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtROI(trade: CalendarTrade): string {
  if (!trade.entry_price || trade.entry_price === 0) return "\u2014";
  const roi = ((trade.exit_price - trade.entry_price) / trade.entry_price) * 100;
  return `${roi >= 0 ? "" : "("}${Math.abs(roi).toFixed(2)}%${roi < 0 ? ")" : ""}`;
}

const COLUMN_CONFIG: Record<ColumnKey, { label: string; align?: "right" | "center" }> = {
  open_time: { label: "Open time" },
  ticker: { label: "Ticker" },
  side: { label: "Side" },
  instrument: { label: "Instrument" },
  net_pnl: { label: "Net P&L", align: "right" },
  net_roi: { label: "Net ROI", align: "right" },
  r_multiple: { label: "R-Multiple", align: "right" },
  duration: { label: "Duration", align: "right" },
  entry_price: { label: "Entry", align: "right" },
  exit_price: { label: "Exit", align: "right" },
  pips: { label: "Pips", align: "right" },
  tags: { label: "Tags" },
};

function TagBadges({
  tags,
  userTags,
}: {
  tags: string[];
  userTags: UserTag[];
}) {
  if (tags.length === 0) return <span className="text-muted-foreground/70">{"\u2014"}</span>;

  const tagColorMap = new Map(userTags.map((ut) => [ut.name.toLowerCase(), ut.color]));
  const visible = tags.slice(0, 3);
  const remaining = tags.length - 3;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {visible.map((tag) => {
        const color = tagColorMap.get(tag.toLowerCase()) ?? "#7C3AED";
        return (
          <span
            key={tag}
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {tag}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="text-[10px] text-muted-foreground">+{remaining}</span>
      )}
    </span>
  );
}

function StrategyBadge({
  strategyId,
  strategies,
}: {
  strategyId: string | null | undefined;
  strategies: Strategy[];
}) {
  if (!strategyId) return <span className="text-muted-foreground/70">{"\u2014"}</span>;
  const strategy = strategies.find((s) => s.id === strategyId);
  if (!strategy) return <span className="text-muted-foreground/70">{"\u2014"}</span>;

  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: strategy.color }}
      />
      <span className="max-w-[80px] truncate">{strategy.name}</span>
    </span>
  );
}

function CellValue({
  col,
  trade,
  strategies,
  userTags,
  userTimezone = "server",
}: {
  col: ColumnKey;
  trade: CalendarTrade;
  strategies: Strategy[];
  userTags: UserTag[];
  userTimezone?: string;
}) {
  switch (col) {
    case "open_time": {
      const time = trade.entry_time ?? trade.time ?? "\u2014";
      const formattedTime = formatTimeWithUserTimezone(time === "\u2014" ? null : time, trade.date, userTimezone);
      return <span className="text-muted-foreground">{formattedTime}</span>;
    }
    case "ticker":
      return <span className="font-medium text-score">{trade.pair}</span>;
    case "side": {
      const side = trade.pips >= 0 ? "LONG" : "SHORT";
      return (
        <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold",
          side === "LONG" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
        )}>
          {side}
        </span>
      );
    }
    case "instrument":
      return <span>{trade.pair}</span>;
    case "net_pnl": {
      const val = trade.profit_dollar ?? trade.pips;
      return (
        <span className={cn("font-medium", val >= 0 ? "text-profit" : "text-loss")}>
          {fmtMoney(val)}
        </span>
      );
    }
    case "net_roi":
      return <span className="text-muted-foreground">{fmtROI(trade)}</span>;
    case "r_multiple": {
      const rr = trade.risk_reward;
      if (rr == null) return <span className="text-muted-foreground">{"\u2014"}</span>;
      return (
        <span className={cn("font-medium", rr >= 0 ? "text-profit" : "text-loss")}>
          {rr.toFixed(2)}R
        </span>
      );
    }
    case "duration":
      return <span className="text-muted-foreground">{fmtDuration(trade.duration_minutes)}</span>;
    case "entry_price":
      return <span className="text-muted-foreground">{trade.entry_price?.toFixed(2) ?? "\u2014"}</span>;
    case "exit_price":
      return <span className="text-muted-foreground">{trade.exit_price?.toFixed(2) ?? "\u2014"}</span>;
    case "pips":
      return (
        <span className={cn("font-medium", trade.pips >= 0 ? "text-profit" : "text-loss")}>
          {trade.pips >= 0 ? "+" : ""}{trade.pips.toFixed(1)}
        </span>
      );
    case "tags":
      return <TagBadges tags={trade.tags ?? []} userTags={userTags} />;
    default:
      return <span>{"\u2014"}</span>;
  }
}

export function DayTradesTable({ trades, columns, strategies = [], userTags = [], userTimezone = "server", onEditTrade }: Props) {
  const { t } = useLanguage();

  if (trades.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t("dayView.noTradesMonth")}
      </p>
    );
  }

  // Sort by time descending
  const sorted = [...trades].sort((a, b) => {
    const ta = a.entry_time ?? a.time ?? "";
    const tb = b.entry_time ?? b.time ?? "";
    return tb.localeCompare(ta);
  });

  const showStrategy = strategies.length > 0;
  const showActions = !!onEditTrade;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {columns.map((col) => (
              <th
                key={col}
                className={cn(
                  "whitespace-nowrap px-3 pb-2 font-medium",
                  COLUMN_CONFIG[col]?.align === "right" && "text-right"
                )}
              >
                {COLUMN_CONFIG[col]?.label ?? col}
              </th>
            ))}
            {showStrategy && (
              <th className="whitespace-nowrap px-3 pb-2 font-medium">
                {t("trades.strategy")}
              </th>
            )}
            {showActions && (
              <th className="whitespace-nowrap px-3 pb-2 font-medium text-right" />
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((trade) => (
            <tr
              key={trade.id}
              className="border-b border-border/30 transition-colors hover:bg-muted/20"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5",
                    COLUMN_CONFIG[col]?.align === "right" && "text-right"
                  )}
                >
                  <CellValue col={col} trade={trade} strategies={strategies} userTags={userTags} userTimezone={userTimezone} />
                </td>
              ))}
              {showStrategy && (
                <td className="whitespace-nowrap px-3 py-2.5">
                  <StrategyBadge strategyId={trade.strategy_id} strategies={strategies} />
                </td>
              )}
              {showActions && (
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onEditTrade(trade)}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={t("common.edit")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

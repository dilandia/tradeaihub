"use client";

import { cn } from "@/lib/utils";
import type { CalendarTrade } from "@/lib/calendar-utils";
import type { ColumnKey } from "./column-selector";

type Props = {
  trades: CalendarTrade[];
  columns: ColumnKey[];
};

function fmtDuration(mins: number | null): string {
  if (mins == null) return "—";
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h${m > 0 ? ` ${m}m` : ""}`;
}

function fmtMoney(val: number | null): string {
  if (val == null) return "—";
  const abs = Math.abs(val);
  if (val >= 0) return `$${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `-$${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtROI(trade: CalendarTrade): string {
  if (!trade.entry_price || trade.entry_price === 0) return "—";
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

function CellValue({ col, trade }: { col: ColumnKey; trade: CalendarTrade }) {
  switch (col) {
    case "open_time":
      return <span className="text-muted-foreground">{trade.entry_time ?? trade.time ?? "—"}</span>;
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
      if (rr == null) return <span className="text-muted-foreground">—</span>;
      return (
        <span className={cn("font-medium", rr >= 0 ? "text-profit" : "text-loss")}>
          {rr >= 0 ? "" : ""}{rr.toFixed(2)}R
        </span>
      );
    }
    case "duration":
      return <span className="text-muted-foreground">{fmtDuration(trade.duration_minutes)}</span>;
    case "entry_price":
      return <span className="text-muted-foreground">{trade.entry_price?.toFixed(2) ?? "—"}</span>;
    case "exit_price":
      return <span className="text-muted-foreground">{trade.exit_price?.toFixed(2) ?? "—"}</span>;
    case "pips":
      return (
        <span className={cn("font-medium", trade.pips >= 0 ? "text-profit" : "text-loss")}>
          {trade.pips >= 0 ? "+" : ""}{trade.pips.toFixed(1)}
        </span>
      );
    case "tags":
      return <span className="text-muted-foreground/70">—</span>;
    default:
      return <span>—</span>;
  }
}

export function DayTradesTable({ trades, columns }: Props) {
  if (trades.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhuma negociação neste dia
      </p>
    );
  }

  // Sort by time descending
  const sorted = [...trades].sort((a, b) => {
    const ta = a.entry_time ?? a.time ?? "";
    const tb = b.entry_time ?? b.time ?? "";
    return tb.localeCompare(ta);
  });

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
                  <CellValue col={col} trade={trade} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

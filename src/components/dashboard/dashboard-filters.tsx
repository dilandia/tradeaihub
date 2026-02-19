"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { Calendar, ChevronDown, Filter, X, Check } from "lucide-react";
import type { CalendarTrade } from "@/lib/calendar-utils";

/* ═══════════════════════════════════════════════
 * Types exportados para serem usados pelo dashboard
 * ═══════════════════════════════════════════════ */

export type TradeFilters = {
  pairs: string[];       // pares selecionados (vazio = todos)
  result: "all" | "win" | "loss";
};

export const DEFAULT_FILTERS: TradeFilters = {
  pairs: [],
  result: "all",
};

/** Aplica filtros sobre trades (client-side). */
export function applyTradeFilters(
  trades: CalendarTrade[],
  filters: TradeFilters
): CalendarTrade[] {
  let out = trades;
  if (filters.pairs.length > 0) {
    const set = new Set(filters.pairs);
    out = out.filter((t) => set.has(t.pair));
  }
  if (filters.result === "win") out = out.filter((t) => t.is_win);
  if (filters.result === "loss") out = out.filter((t) => !t.is_win);
  return out;
}

/* ═══════════════════════════════════════════════
 * Date Range Dropdown
 * ═══════════════════════════════════════════════ */

const PRESET_RANGE_KEYS: { key: string; value: string }[] = [
  { key: "filters.days7", value: "7d" },
  { key: "filters.days14", value: "14d" },
  { key: "filters.days30", value: "30d" },
  { key: "filters.days90", value: "90d" },
  { key: "filters.months6", value: "6m" },
  { key: "filters.year1", value: "1y" },
  { key: "dashboard.ytd", value: "ytd" },
  { key: "filters.allTime", value: "all" },
];

type DateRangeButtonProps = {
  value: string;
  onChange?: (v: string) => void;
};

export function DateRangeButton({ value, onChange }: DateRangeButtonProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PRESET_RANGE_KEYS.find((r) => r.value === value) ?? PRESET_RANGE_KEYS[2];

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3",
          "text-sm font-medium text-foreground transition-colors",
          "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background",
          value !== "all" && "border-score/40"
        )}
        aria-label={t("filters.period")}
        aria-expanded={open}
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline">{t(current.key)}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {PRESET_RANGE_KEYS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                onChange?.(r.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors",
                value === r.value
                  ? "bg-score/10 text-score font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {t(r.key)}
              {value === r.value && (
                <Check className="ml-auto h-4 w-4 text-score" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
 * Filters Panel
 * ═══════════════════════════════════════════════ */

type FiltersButtonProps = {
  trades: CalendarTrade[];
  filters: TradeFilters;
  onChange: (filters: TradeFilters) => void;
};

export function FiltersButton({ trades, filters, onChange }: FiltersButtonProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── Extrair pares disponíveis (ordenados por frequência) ── */
  const availablePairs = useMemo(() => {
    const freq = new Map<string, number>();
    for (const t of trades) {
      freq.set(t.pair, (freq.get(t.pair) ?? 0) + 1);
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([pair, count]) => ({ pair, count }));
  }, [trades]);

  /* ── Contar filtros ativos ── */
  const activeCount =
    (filters.pairs.length > 0 ? 1 : 0) +
    (filters.result !== "all" ? 1 : 0);

  const isAllPairs = filters.pairs.length === 0;

  function togglePair(pair: string) {
    const current = filters.pairs;
    const next = current.includes(pair)
      ? current.filter((p) => p !== pair)
      : [...current, pair];
    onChange({ ...filters, pairs: next });
  }

  function setResult(result: TradeFilters["result"]) {
    onChange({ ...filters, result });
  }

  function clearAll() {
    onChange(DEFAULT_FILTERS);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3",
          "text-sm font-medium text-foreground transition-colors",
          "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background",
          activeCount > 0 && "border-score/40"
        )}
        aria-label={t("filters.filters")}
        aria-expanded={open}
      >
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline">{t("filters.filters")}</span>
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-score text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-border bg-card p-4 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {/* ── Header ── */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{t("filters.filters")}</h3>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("filters.clearAll")}
              </button>
            )}
          </div>

          {/* ── Resultado ── */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("filters.result")}
            </p>
            <div className="flex gap-1.5">
              {(
                [
                  { labelKey: "filters.all", value: "all" },
                  { labelKey: "filters.wins", value: "win" },
                  { labelKey: "filters.losses", value: "loss" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setResult(opt.value)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    filters.result === opt.value
                      ? opt.value === "win"
                        ? "bg-profit/15 text-profit"
                        : opt.value === "loss"
                          ? "bg-loss/15 text-loss"
                          : "bg-score/10 text-score"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Pares ── */}
          {availablePairs.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("filters.pairs")} ({availablePairs.length})
                </p>
                {!isAllPairs && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, pairs: [] })}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {t("filters.all")}
                  </button>
                )}
              </div>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {availablePairs.map(({ pair, count }) => {
                  const selected = isAllPairs || filters.pairs.includes(pair);
                  return (
                    <button
                      key={pair}
                      type="button"
                      onClick={() => togglePair(pair)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        selected && !isAllPairs
                          ? "bg-score/15 text-score ring-1 ring-score/30"
                          : selected
                            ? "bg-muted/50 text-foreground hover:bg-muted"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {pair}
                      <span className="text-[10px] opacity-60">{count}</span>
                      {!isAllPairs && filters.pairs.includes(pair) && (
                        <X className="ml-0.5 h-3 w-3" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Resumo ── */}
          {activeCount > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-[11px] text-muted-foreground">
                {t("filters.activeFilters", { count: activeCount })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
 * Compat: antiga DashboardFilters (deprecated)
 * ═══════════════════════════════════════════════ */

interface DashboardFiltersProps {
  dateRange?: string;
  symbols?: string[];
  onDateRangeChange?: (value: string) => void;
  onSymbolsChange?: (value: string[]) => void;
  className?: string;
}

export function DashboardFilters(_props: DashboardFiltersProps) {
  return null;
}

"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Loader2,
  ArrowRightLeft,
  Clock,
  Target,
  LogOut,
  Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { Strategy } from "@/app/actions/strategies";

type StrategyCardProps = {
  strategy: Strategy;
  onEdit: (strategy: Strategy) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function StrategyCard({
  strategy,
  onEdit,
  onDelete,
  isDeleting,
}: StrategyCardProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const totalRules =
    (strategy.entry_rules?.length ?? 0) + (strategy.exit_rules?.length ?? 0);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20"
        >
          {/* Color indicator */}
          <div
            className="h-10 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: strategy.color }}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {strategy.name}
              </h3>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  strategy.is_active
                    ? "bg-profit/10 text-profit"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {strategy.is_active
                  ? t("strategies.active")
                  : t("strategies.inactive")}
              </span>
            </div>
            {strategy.description && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {strategy.description}
              </p>
            )}
          </div>

          {/* Summary badges */}
          <div className="hidden items-center gap-2 sm:flex">
            {strategy.timeframes.length > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-muted/30 px-2 py-0.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {strategy.timeframes.slice(0, 3).join(", ")}
                  {strategy.timeframes.length > 3 && ` +${strategy.timeframes.length - 3}`}
                </span>
              </div>
            )}
            {totalRules > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-muted/30 px-2 py-0.5">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {totalRules} {t("strategies.rules")}
                </span>
              </div>
            )}
          </div>

          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-border px-4 py-4 space-y-4">
            {/* Entry Rules */}
            {strategy.entry_rules.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  {t("strategies.entryRules")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.entry_rules.map((rule, i) => (
                    <span
                      key={`entry-${i}`}
                      className="rounded-full border border-border bg-muted/20 px-2.5 py-1 text-xs text-foreground"
                    >
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Exit Rules */}
            {strategy.exit_rules.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <LogOut className="h-3.5 w-3.5" />
                  {t("strategies.exitRules")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.exit_rules.map((rule, i) => (
                    <span
                      key={`exit-${i}`}
                      className="rounded-full border border-border bg-muted/20 px-2.5 py-1 text-xs text-foreground"
                    >
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* No rules */}
            {strategy.entry_rules.length === 0 &&
              strategy.exit_rules.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  {t("strategies.noRules")}
                </p>
              )}

            {/* Pairs */}
            {strategy.pairs.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  {t("strategies.pairs")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.pairs.map((pair) => (
                    <span
                      key={pair}
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${strategy.color}15`,
                        color: strategy.color,
                        border: `1px solid ${strategy.color}30`,
                      }}
                    >
                      {pair}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timeframes */}
            {strategy.timeframes.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {t("strategies.timeframes")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.timeframes.map((tf) => (
                    <span
                      key={tf}
                      className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {tf}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Risk per trade */}
            {strategy.risk_per_trade != null && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Percent className="h-3.5 w-3.5" />
                <span>
                  {t("strategies.riskPerTrade")}: {strategy.risk_per_trade}%
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => onEdit(strategy)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {t("common.edit")}
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-1">
                    {t("strategies.deleteConfirm")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(strategy.id);
                      setConfirmDelete(false);
                    }}
                    disabled={isDeleting}
                    className="rounded bg-loss px-2 py-1 text-xs text-white hover:bg-loss/90"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      t("strategies.deleteYes")
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded bg-muted px-2 py-1 text-xs text-foreground"
                  >
                    {t("strategies.deleteNo")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-loss/30 hover:text-loss transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("strategies.delete")}
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

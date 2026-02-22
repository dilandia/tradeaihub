"use client";

import { useState, useTransition } from "react";
import { Plus, Target, CheckCircle, AlertCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { usePlan } from "@/contexts/plan-context";
import {
  createStrategy,
  updateStrategy,
  deleteStrategy,
  type Strategy,
  type StrategyFormData,
} from "@/app/actions/strategies";
import { StrategyCard } from "@/components/strategies/strategy-card";
import { StrategyForm } from "@/components/strategies/strategy-form";

type Props = {
  strategies: Strategy[];
};

export function StrategiesPageContent({ strategies: initialStrategies }: Props) {
  const { t } = useLanguage();
  const { planInfo } = usePlan();
  const [isPending, startTransition] = useTransition();

  const [strategies, setStrategies] = useState(initialStrategies);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const maxStrategies = planInfo?.maxStrategies ?? 3;
  const canCreate = strategies.length < maxStrategies;

  function showStatus(type: "success" | "error", msg: string) {
    setStatus(type);
    setStatusMsg(msg);
    if (type === "success") {
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  function handleStartCreate() {
    if (!canCreate) {
      showStatus("error", t("strategies.limitReached", { max: maxStrategies }));
      return;
    }
    setEditingStrategy(null);
    setMode("create");
    setStatus("idle");
  }

  function handleStartEdit(strategy: Strategy) {
    setEditingStrategy(strategy);
    setMode("edit");
    setStatus("idle");
  }

  function handleCancel() {
    setMode("list");
    setEditingStrategy(null);
  }

  function handleCreate(data: StrategyFormData) {
    startTransition(async () => {
      const result = await createStrategy(data);
      if (result.success) {
        setStrategies((prev) => [
          {
            id: result.id ?? crypto.randomUUID(),
            name: data.name,
            description: data.description ?? null,
            entry_rules: data.entry_rules ?? [],
            exit_rules: data.exit_rules ?? [],
            timeframes: data.timeframes ?? [],
            pairs: data.pairs ?? [],
            risk_per_trade: data.risk_per_trade ?? null,
            color: data.color ?? "#6366f1",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setMode("list");
        showStatus("success", t("strategies.created"));
      } else {
        showStatus("error", result.error ?? t("strategies.errorCreate"));
      }
    });
  }

  function handleUpdate(data: StrategyFormData) {
    if (!editingStrategy) return;
    startTransition(async () => {
      const result = await updateStrategy(editingStrategy.id, data);
      if (result.success) {
        setStrategies((prev) =>
          prev.map((s) =>
            s.id === editingStrategy.id
              ? {
                  ...s,
                  name: data.name,
                  description: data.description ?? null,
                  entry_rules: data.entry_rules ?? s.entry_rules,
                  exit_rules: data.exit_rules ?? s.exit_rules,
                  timeframes: data.timeframes ?? s.timeframes,
                  pairs: data.pairs ?? s.pairs,
                  risk_per_trade: data.risk_per_trade ?? s.risk_per_trade,
                  color: data.color ?? s.color,
                  updated_at: new Date().toISOString(),
                }
              : s
          )
        );
        setMode("list");
        setEditingStrategy(null);
        showStatus("success", t("strategies.updated"));
      } else {
        showStatus("error", result.error ?? t("strategies.errorUpdate"));
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteStrategy(id);
      if (result.success) {
        setStrategies((prev) => prev.filter((s) => s.id !== id));
        showStatus("success", t("strategies.deleted"));
      } else {
        showStatus("error", result.error ?? t("strategies.errorDelete"));
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t("strategies.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("strategies.subtitle")}
          </p>
        </div>
        {mode === "list" && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-score px-3 py-1.5 text-xs font-medium text-white hover:bg-score/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("strategies.newStrategy")}
          </button>
        )}
      </div>

      {/* Status */}
      {status !== "idle" && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm",
            status === "success"
              ? "bg-profit/10 text-profit"
              : "bg-loss/10 text-loss"
          )}
        >
          <div className="flex items-center gap-2">
            {status === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {statusMsg}
          </div>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="rounded p-0.5 hover:bg-black/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Form (create/edit) */}
      {mode !== "list" && (
        <Card className="border-score/30">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {mode === "create"
                  ? t("strategies.newStrategy")
                  : t("strategies.editStrategy")}
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <StrategyForm
              strategy={editingStrategy ?? undefined}
              onSubmit={mode === "create" ? handleCreate : handleUpdate}
              onCancel={handleCancel}
              isPending={isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {strategies.length === 0 && mode === "list" && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-sm font-semibold text-foreground">
              {t("strategies.emptyTitle")}
            </h3>
            <p className="mt-1 max-w-sm mx-auto text-xs text-muted-foreground">
              {t("strategies.emptyDescription")}
            </p>
            <button
              type="button"
              onClick={handleStartCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-score px-4 py-2 text-sm font-medium text-white hover:bg-score/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t("strategies.createFirst")}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Strategies list */}
      {strategies.length > 0 && mode === "list" && (
        <div className="space-y-3">
          {strategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onEdit={handleStartEdit}
              onDelete={handleDelete}
              isDeleting={isPending}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {mode === "list" && (
        <p className="text-center text-xs text-muted-foreground">
          {strategies.length} / {maxStrategies >= 999 ? "∞" : maxStrategies}
        </p>
      )}
    </div>
  );
}

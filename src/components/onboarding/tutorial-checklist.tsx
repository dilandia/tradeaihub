"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Check, Circle, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { TutorialCelebrationModal, wasCelebrated } from "./tutorial-celebration-modal";

const STORAGE_KEY = "takez-tutorial-progress";

type StepId = "explore" | "addTrade" | "customize" | "analytics" | "import";

const STEPS: { id: StepId; labelKey: string; descKey: string; href: string }[] = [
  { id: "explore", labelKey: "tutorial.exploreDashboard", descKey: "tutorial.exploreDashboardDesc", href: "/" },
  { id: "addTrade", labelKey: "tutorial.addFirstTrade", descKey: "tutorial.addFirstTradeDesc", href: "/import" },
  { id: "customize", labelKey: "tutorial.customizeLayout", descKey: "tutorial.customizeLayoutDesc", href: "/" },
  { id: "analytics", labelKey: "tutorial.viewAnalytics", descKey: "tutorial.viewAnalyticsDesc", href: "/reports" },
  { id: "import", labelKey: "tutorial.viewYourTrades", descKey: "tutorial.viewYourTradesDesc", href: "/trades" },
];

function loadProgress(): Set<StepId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr.filter((x): x is StepId => STEPS.some((s) => s.id === x)));
  } catch {
    return new Set();
  }
}

function saveProgress(done: Set<StepId>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
  } catch {}
}

type Props = {
  tradesCount?: number;
  onCustomizeClick?: () => void;
};

export function TutorialChecklist({ tradesCount = 0, onCustomizeClick }: Props) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [done, setDone] = useState<Set<StepId>>(() => new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const effectiveCompletedCount = useMemo(() => {
    let count = 0;
    for (const step of STEPS) {
      const isDone = done.has(step.id);
      const isAddTrade = step.id === "addTrade" && tradesCount > 0;
      if (isDone || isAddTrade) count++;
    }
    return count;
  }, [done, tradesCount]);

  const completedCount = done.size;
  const totalCount = STEPS.length;

  const markDone = (id: StepId) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveProgress(next);
      return next;
    });
  };

  useEffect(() => {
    const loaded = loadProgress();
    setDone((prev) => {
      const next = new Set(loaded);
      if (!next.has("explore")) next.add("explore");
      saveProgress(next);
      return next;
    });
  }, []);

  const handleStepClick = (step: (typeof STEPS)[0]) => {
    if (step.id === "customize" && onCustomizeClick) {
      onCustomizeClick();
    }
    markDone(step.id);
  };

  useEffect(() => {
    if (wasCelebrated()) setIsCompleted(true);
  }, []);

  useEffect(() => {
    if (effectiveCompletedCount === 5 && !wasCelebrated()) {
      setShowCelebration(true);
    }
  }, [effectiveCompletedCount]);

  if (isCompleted) return null;

  return (
    <div className="rounded-xl border border-border bg-card/80 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-score/20">
            <Sparkles className="h-5 w-5 text-score" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("tutorial.title")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("tutorial.subtitle")} — {completedCount}/{totalCount}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => {
            const isDone = done.has(step.id);
            const isAddTrade = step.id === "addTrade" && tradesCount > 0;
            const effectiveDone = isDone || isAddTrade;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                  effectiveDone
                    ? "border-profit/40 bg-profit/5"
                    : "border-border bg-muted/20 hover:border-score/50"
                )}
              >
                <div className="shrink-0 pt-0.5">
                  {effectiveDone ? (
                    <Check className="h-5 w-5 text-profit" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" strokeWidth={2} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{t(step.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(step.descKey)}</p>
                  {step.id === "customize" && onCustomizeClick ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleStepClick(step);
                        onCustomizeClick();
                      }}
                      className="mt-2 text-xs font-medium text-score hover:underline"
                    >
                      {t("tutorial.customizeLayout")} →
                    </button>
                  ) : (
                    <Link
                      href={step.href}
                      onClick={() => handleStepClick(step)}
                      className="mt-2 inline-block text-xs font-medium text-score hover:underline"
                    >
                      {t(step.labelKey)} →
                    </Link>
                  )}
                </div>
              </div>
            );
          }          )}
        </div>
      )}

      <TutorialCelebrationModal
        open={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          setIsCompleted(true);
        }}
      />
    </div>
  );
}

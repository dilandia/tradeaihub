"use client";

import {
  Target,
  Sparkles,
  BarChart3,
  GitCompare,
  Layers,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

const FEATURES = [
  { key: "strategiesComingSoon.feature1", icon: Layers },
  { key: "strategiesComingSoon.feature2", icon: Target },
  { key: "strategiesComingSoon.feature3", icon: BarChart3 },
  { key: "strategiesComingSoon.feature4", icon: GitCompare },
] as const;

export function StrategiesComingSoon() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5 md:p-12">
        {/* Badge e ícone */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-score/15 ring-1 ring-score/30">
              <Target className="h-10 w-10 text-score" />
            </div>
            <div className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" />
              {t("strategiesComingSoon.badge")}
            </div>
          </div>
        </div>

        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-score">
          {t("strategiesComingSoon.subheading")}
        </p>

        <h1 className="mt-3 text-center text-2xl font-bold text-foreground md:text-3xl">
          {t("strategiesComingSoon.heading")}
        </h1>

        <p className="mt-3 text-center text-sm text-muted-foreground md:text-base">
          {t("strategiesComingSoon.description")}
        </p>

        {/* Preview visual */}
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-muted/20">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="ml-2 text-xs text-muted-foreground">
              {t("strategiesComingSoon.previewLabel")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-px bg-border p-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-lg bg-card p-3",
                  "animate-pulse"
                )}
              >
                <div className="h-8 w-8 rounded-lg bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-16 rounded bg-muted" />
                  <div className="h-2 w-12 rounded bg-muted/70" />
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Lista de benefícios */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ key, icon: Icon }) => (
            <li
              key={key}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3",
                "transition-colors hover:bg-muted/50"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-score/10 text-score">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-foreground">{t(key)}</span>
            </li>
          ))}
        </ul>

        {/* Badge Em breve no lugar do botão */}
        <div className="mt-10 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4" />
            {t("strategiesComingSoon.badge")}
          </span>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {t("strategiesComingSoon.footer")}
        </p>
      </div>
    </div>
  );
}

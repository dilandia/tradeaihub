"use client";

import Link from "next/link";
import { usePlan } from "@/contexts/plan-context";
import { useLanguage } from "@/contexts/language-context";
import {
  Lock,
  ArrowRight,
  Crown,
  BarChart3,
  Target,
  Calendar,
  GitCompare,
  RefreshCw,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { key: "reportsGate.feature1", icon: BarChart3 },
  { key: "reportsGate.feature2", icon: Target },
  { key: "reportsGate.feature3", icon: GitCompare },
  { key: "reportsGate.feature4", icon: Calendar },
] as const;

const REASSURANCE = [
  { key: "reportsGate.guarantee", icon: RefreshCw },
  { key: "reportsGate.cancelAnytime", icon: Shield },
  { key: "reportsGate.securePayment", icon: Shield },
] as const;

type Props = { children: React.ReactNode };

export function ReportsPlanGate({ children }: Props) {
  const { planInfo, isLoading, canAccessReports } = usePlan();
  const { t } = useLanguage();

  if (isLoading) return null;
  if (planInfo && canAccessReports()) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5 md:p-12">
        {/* Ícone e badge */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-score/15 ring-1 ring-score/30">
              <Lock className="h-10 w-10 text-score" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
              <Crown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Subheading */}
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-score">
          {t("reportsGate.subheading")}
        </p>

        {/* Título */}
        <h2 className="mt-3 text-center text-2xl font-bold text-foreground md:text-3xl">
          {t("reportsGate.heading")}
        </h2>

        {/* Descrição */}
        <p className="mt-3 text-center text-sm text-muted-foreground md:text-base">
          {t("reportsGate.description")}
        </p>

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

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/settings/subscription"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold",
              "bg-score text-amber-400",
              "hover:bg-score/90 hover:scale-[1.02] hover:shadow-xl hover:shadow-score/30",
              "transition-all duration-200 shadow-lg shadow-score/25"
            )}
          >
            <Crown className="h-5 w-5" />
            {t("reportsGate.upgradeCta")}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/settings/subscription"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {t("upgradeModal.comparePlans")}
          </Link>
        </div>

        {/* Garantias */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 border-t border-border pt-8">
          {REASSURANCE.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t(key)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

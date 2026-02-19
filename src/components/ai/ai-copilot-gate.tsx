"use client";

import Link from "next/link";
import { usePlan } from "@/contexts/plan-context";
import { useLanguage } from "@/contexts/language-context";
import { ArrowRight, Crown, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { children: React.ReactNode };

export function AiCopilotGate({ children }: Props) {
  const { planInfo, isLoading, canUseAiCopilot } = usePlan();
  const { t } = useLanguage();

  if (isLoading) return null;
  if (planInfo && canUseAiCopilot()) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5 md:p-12">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/30">
              <MessageCircle className="h-10 w-10 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
              <Crown className="h-4 w-4" />
            </div>
          </div>
        </div>

        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          Elite
        </p>

        <h2 className="mt-3 text-center text-2xl font-bold text-foreground md:text-3xl">
          {t("aiCopilotGate.heading")}
        </h2>

        <p className="mt-3 text-center text-sm text-muted-foreground md:text-base">
          {t("aiCopilotGate.description")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/settings/subscription"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold",
              "bg-violet-600 text-white hover:bg-violet-700",
              "hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/30",
              "transition-all duration-200 shadow-lg"
            )}
          >
            <Crown className="h-5 w-5" />
            {t("aiCopilotGate.upgradeCta")}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/settings/subscription"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {t("upgradeModal.comparePlans")}
          </Link>
        </div>
      </div>
    </div>
  );
}

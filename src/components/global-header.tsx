"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDataSource } from "@/contexts/data-source-context";
import { useLanguage } from "@/contexts/language-context";
import { usePlan } from "@/contexts/plan-context";
import {
  DataSourceSelector,
  type DataSourceSelection,
} from "@/components/dashboard/data-source-selector";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/app/actions/auth";
import { syncTradingAccount } from "@/app/actions/trading-accounts";

type Props = {
  userName: string | null;
  lastSyncAt?: string | null;
};

export function GlobalHeader({ userName, lastSyncAt }: Props) {
  const { selection, setSelection, accounts, imports } = useDataSource();
  const { t } = useLanguage();
  const { planInfo, isLoading: isPlanLoading } = usePlan();
  const pathname = usePathname();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = useCallback(async () => {
    if (isSyncing) return;
    if (accounts.length === 0) {
      toast.info(t("common.syncNoAccounts"));
      return;
    }

    const plan = planInfo?.plan ?? "free";
    if (plan === "free") {
      toast.info(t("common.syncProOnly"));
      return;
    }

    setIsSyncing(true);

    const syncSteps = [
      t("settings.accountsPage.syncStep1"),
      t("settings.accountsPage.syncStep2"),
      t("settings.accountsPage.syncStep3"),
      t("settings.accountsPage.syncStep4"),
      t("settings.accountsPage.syncStep5"),
      t("settings.accountsPage.syncStep6"),
      t("settings.accountsPage.syncStep7"),
    ];

    let totalSuccess = 0;
    let totalFailed = 0;

    for (const account of accounts) {
      const toastId = `header-sync-${account.id}`;
      let stepIndex = 0;
      toast.loading(syncSteps[0], { id: toastId, description: account.name });

      const interval = setInterval(() => {
        stepIndex = Math.min(stepIndex + 1, syncSteps.length - 1);
        toast.loading(syncSteps[stepIndex], { id: toastId, description: account.name });
      }, 3000);

      try {
        const result = await syncTradingAccount(account.id);
        clearInterval(interval);

        if (result.success) {
          totalSuccess++;
          toast.success(t("settings.accountsPage.syncSuccess"), {
            id: toastId,
            description: account.name,
          });
        } else {
          totalFailed++;
          toast.error(t("settings.accountsPage.syncFailed"), {
            id: toastId,
            description: result.error ?? account.name,
          });
        }
      } catch {
        clearInterval(interval);
        totalFailed++;
        toast.error(t("common.syncError"), { id: toastId, description: account.name });
      }
    }

    if (totalSuccess > 0) {
      router.refresh();
    }

    setIsSyncing(false);
  }, [isSyncing, accounts, planInfo, t, router]);

  const plan = planInfo?.plan ?? "free";
  const planLabel = t(`plans.${plan}`);

  const hasAnySource = accounts.length > 0 || imports.length > 0;

  /** Ao trocar data source: atualizar contexto + URL search params */
  const handleSourceChange = (sel: DataSourceSelection) => {
    setSelection(sel);

    /* Construir query params mantendo a rota atual */
    let qs = "";
    if (sel.type === "account" && sel.id) {
      qs = `?account=${sel.id}`;
    } else if (sel.type === "import" && sel.id) {
      qs = `?import=${sel.id}`;
    }
    router.push(`${pathname}${qs}`);
  };

  /* Label para o seletor atual */
  let sourceLabel = t("common.allData");
  if (selection.type === "account" && selection.id) {
    const acc = accounts.find((a) => a.id === selection.id);
    if (acc) sourceLabel = acc.name;
  } else if (selection.type === "import" && selection.id) {
    const imp = imports.find((i) => i.id === selection.id);
    if (imp) sourceLabel = imp.filename;
  }

  return (
    <header className="sticky top-0 z-[100] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-1.5 overflow-x-auto pl-14 pr-3 scrollbar-none sm:gap-3 sm:pr-4 lg:pl-6 lg:pr-6">
        {/* Left: user greeting + refresh button + last sync */}
        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {userName ? t("common.hello", { name: userName }) : t("common.appName")}
            </span>
            {lastSyncAt && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                {t("common.lastSync")}{" "}
                {new Date(lastSyncAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label={t("common.syncNow")}
            title={t("common.syncNow")}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
          </button>
        </div>

        {/* Center: Current source badge — hidden on mobile */}
        {hasAnySource && selection.type !== "all" && (
          <div className="ml-2 hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground sm:flex">
            <span className="font-medium text-foreground">{sourceLabel}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Right: actions — compact on mobile */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Sync button — visible on mobile (lg+ has it in left section) */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 lg:hidden"
            aria-label={t("common.syncNow")}
            title={t("common.syncNow")}
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          </button>
          {/* Plan badge — hidden below sm */}
          {isPlanLoading ? (
            <span className="hidden h-6 w-14 animate-pulse rounded-full bg-muted sm:inline-block" />
          ) : (
            <span
              className={cn(
                "hidden rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide sm:inline-block",
                plan === "elite" && "bg-amber-500/20 text-amber-600 dark:text-amber-400",
                plan === "pro" && "bg-violet-500/20 text-violet-600 dark:text-violet-400",
                plan === "free" && "bg-muted text-muted-foreground"
              )}
            >
              {planLabel}
            </span>
          )}
          <ThemeToggle />
          <LanguageSelector />
          {hasAnySource && (
            <DataSourceSelector
              accounts={accounts}
              imports={imports}
              selection={selection}
              onChange={handleSourceChange}
            />
          )}
          {/* Logout — hidden on mobile (available in sidebar) */}
          <form action={signOut} className="hidden sm:block">
            <button
              type="submit"
              className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("common.logout")}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

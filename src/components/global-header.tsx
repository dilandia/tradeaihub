"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";

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
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      for (const interval of stepIntervalsRef.current.values()) {
        clearInterval(interval);
      }
      stepIntervalsRef.current.clear();
    };
  }, []);

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
    const toastId = "header-sync";

    try {
      const res = await fetch("/api/smart-sync?force=true", { method: "POST" });
      const body = await res.json();

      // Non-202: API error
      if (!res.ok && res.status !== 200) {
        toast.error(t("settings.accountsPage.syncFailed"), { id: toastId });
        setIsSyncing(false);
        return;
      }

      // Skipped responses (200 with skipped: true)
      if (body.skipped) {
        const msg =
          body.reason === "no_accounts"
            ? t("common.syncNoAccounts")
            : body.reason === "free_plan"
              ? t("common.syncProOnly")
              : t("settings.accountsPage.syncFailed");
        toast.info(msg, { id: toastId });
        setIsSyncing(false);
        return;
      }

      // 202 triggered — start polling
      const accountIds: string[] = body.accounts ?? [];
      if (accountIds.length === 0) {
        setIsSyncing(false);
        return;
      }

      // Build name map from context accounts for toast messages
      const nameMap = new Map<string, string>();
      for (const a of accounts) {
        nameMap.set(a.id, a.name);
      }

      const syncSteps = [
        t("settings.accountsPage.syncStep1"),
        t("settings.accountsPage.syncStep2"),
        t("settings.accountsPage.syncStep3"),
        t("settings.accountsPage.syncStep4"),
        t("settings.accountsPage.syncStep5"),
        t("settings.accountsPage.syncStep6"),
        t("settings.accountsPage.syncStep7"),
      ];

      // Start per-account toasts with rotating step messages (same UX as settings page)
      const stepIndexes = new Map<string, number>();
      for (const accountId of accountIds) {
        const accountName = nameMap.get(accountId) ?? accountId;
        stepIndexes.set(accountId, 0);
        toast.loading(syncSteps[0], {
          id: `header-sync-${accountId}`,
          description: accountName,
        });
        const stepInterval = setInterval(() => {
          const idx = stepIndexes.get(accountId) ?? 0;
          const next = Math.min(idx + 1, syncSteps.length - 1);
          stepIndexes.set(accountId, next);
          toast.loading(syncSteps[next], {
            id: `header-sync-${accountId}`,
            description: accountName,
          });
        }, 3000);
        stepIntervalsRef.current.set(accountId, stepInterval);
      }

      const finishedAccounts = new Set<string>();
      const supabase = createClient();

      pollIntervalRef.current = setInterval(async () => {
        try {
          const { data } = await supabase
            .from("trading_accounts")
            .select("id, status, account_name, error_message")
            .in("id", accountIds)
            .is("deleted_at", null);

          if (!data) return;

          for (const row of data) {
            if (finishedAccounts.has(row.id)) continue;

            const accountName = nameMap.get(row.id) ?? row.account_name ?? row.id;

            if (row.status === "connected" || row.status === "error") {
              // Stop rotating steps for this account
              const stepInterval = stepIntervalsRef.current.get(row.id);
              if (stepInterval) {
                clearInterval(stepInterval);
                stepIntervalsRef.current.delete(row.id);
              }
              finishedAccounts.add(row.id);

              if (row.status === "connected") {
                toast.success(t("settings.accountsPage.syncSuccess"), {
                  id: `header-sync-${row.id}`,
                  description: accountName,
                });
              } else {
                toast.error(t("settings.accountsPage.syncFailed"), {
                  id: `header-sync-${row.id}`,
                  description: row.error_message ?? accountName,
                });
              }
            }
            // status === "syncing" → still in progress, keep rotating
          }

          // All accounts finished
          if (finishedAccounts.size >= accountIds.length) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsSyncing(false);
            router.refresh();
          }
        } catch {
          // Polling error — silently retry on next interval
        }
      }, 5000);
    } catch {
      toast.error(t("settings.accountsPage.syncFailed"), { id: toastId });
      setIsSyncing(false);
    }
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

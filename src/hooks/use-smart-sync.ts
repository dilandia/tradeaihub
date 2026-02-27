"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { TradingAccountSafe } from "@/lib/trading-accounts";

/**
 * Smart Sync hook — triggers auto-sync on dashboard mount.
 * Fires POST /api/smart-sync which is plan-gated server-side.
 * Only triggers once per mount, with 500ms delay to not block paint.
 */
export function useSmartSync(accounts: TradingAccountSafe[]) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (accounts.length === 0) return;
    if (hasTriggered.current) return;

    const autoSyncAccounts = accounts.filter((a) => a.auto_sync_enabled);
    if (autoSyncAccounts.length === 0) return;

    hasTriggered.current = true;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/smart-sync", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.skipped) return;

        if (data.triggered && data.accounts?.length > 0) {
          const triggeredIds: string[] = data.accounts;
          const triggeredNames = accounts
            .filter((a) => triggeredIds.includes(a.id))
            .map((a) => a.account_name);

          toast.loading("Sincronizando contas automaticamente...", {
            id: "smart-sync",
            description: triggeredNames.join(", "),
          });

          // Auto-dismiss after estimated time (3 min per account, cap 10 min)
          const estimatedMs = triggeredIds.length * 3 * 60 * 1000;
          setTimeout(() => {
            toast.dismiss("smart-sync");
          }, Math.min(estimatedMs, 10 * 60 * 1000));
        }
      } catch {
        // Silent fail — smart sync is best-effort
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [accounts]);
}

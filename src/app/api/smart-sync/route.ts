/**
 * POST /api/smart-sync
 *
 * Smart Sync — auto-sync trading accounts when user opens the dashboard.
 * Plan-gated: only Pro/Elite users trigger sync.
 * Cooldown: 3 hours per account.
 * Responds 202 immediately, syncs in background (fire-and-forget).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanInfo } from "@/lib/plan";
import { syncAccountWithMetaApi } from "@/lib/metaapi-sync";
import { syncLogger } from "@/lib/logger";

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const STALE_SYNC_MS = 10 * 60 * 1000; // 10 min — auto-recover stuck "syncing" status

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";
  try {
    // 1. Auth
    const supabase = await createClient();
    let user = null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error) user = data.user;
    } catch {
      // Auth check failed silently — user remains null
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Plan gate (server-side, admin client)
    const planInfo = await getPlanInfo(user.id);
    if (!planInfo?.canUseMetaApi) {
      return NextResponse.json({ skipped: true, reason: "free_plan" });
    }

    // 3. Fetch candidate accounts
    // When force=true (manual sync), include ALL active accounts regardless of auto_sync_enabled.
    // The auto_sync_enabled flag only gates automatic background sync, not explicit user-triggered sync.
    const admin = createAdminClient();
    let query = admin
      .from("trading_accounts")
      .select("id, account_name, last_sync_at, status, updated_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("metaapi_account_id", "is", null);

    if (!force) {
      query = query.eq("auto_sync_enabled", true);
    }

    const { data: accounts } = await query;

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ skipped: true, reason: "no_accounts" });
    }

    // 3.5. Auto-recover accounts stuck in "syncing" for > 10 min (crash/restart protection)
    const now = Date.now();
    for (const a of accounts) {
      if (a.status === "syncing" && a.updated_at) {
        const stuckFor = now - new Date(a.updated_at).getTime();
        if (stuckFor > STALE_SYNC_MS) {
          syncLogger.warn({ accountName: a.account_name, stuckMinutes: Math.round(stuckFor / 60000) }, "Auto-recovering stale sync");
          await admin
            .from("trading_accounts")
            .update({ status: "error", error_message: "Sync interrompido (recuperação automática)", updated_at: new Date().toISOString() })
            .eq("id", a.id);
          a.status = "error"; // Update in-memory too for the filter below
        }
      }
    }

    // 4. Cooldown filter (bypassed when force=true for manual sync)
    const eligible = accounts.filter((a) => {
      if (a.status === "syncing") return false;
      if (force) return true;
      if (!a.last_sync_at) return true;
      return now - new Date(a.last_sync_at).getTime() >= THREE_HOURS_MS;
    });

    if (eligible.length === 0) {
      return NextResponse.json({ skipped: true, reason: "cooldown" });
    }

    // 5. Respond immediately (non-blocking)
    const accountIds = eligible.map((a) => a.id);

    // 6. Fire-and-forget: sequential background sync
    const userId = user.id;
    const runSequentialSync = async () => {
      for (const account of eligible) {
        try {
          await admin
            .from("trading_accounts")
            .update({ status: "syncing", updated_at: new Date().toISOString() })
            .eq("id", account.id)
            .eq("user_id", userId);

          const result = await syncAccountWithMetaApi(account.id, userId);

          if (!result.success) {
            await admin
              .from("trading_accounts")
              .update({
                status: "error",
                error_message: result.error ?? "Smart sync failed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", account.id)
              .eq("user_id", userId);
          }
          // On success, syncAccountWithMetaApi already updates status to "connected"
        } catch (err) {
          syncLogger.error({ accountId: account.id, error: err instanceof Error ? err.message : String(err) }, "Background sync failed");
          await admin
            .from("trading_accounts")
            .update({
              status: "error",
              error_message: "Smart sync error",
              updated_at: new Date().toISOString(),
            })
            .eq("id", account.id)
            .eq("user_id", userId);
        }
      }
      syncLogger.info({ accountCount: accountIds.length }, "Background sync complete");
    };

    runSequentialSync().catch((err) =>
      syncLogger.error({ error: err instanceof Error ? err.message : String(err) }, "Sequential sync rejected")
    );

    return NextResponse.json(
      { triggered: true, accounts: accountIds },
      { status: 202 }
    );
  } catch (err) {
    syncLogger.error({ error: err instanceof Error ? err.message : String(err) }, "Smart-sync route error");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

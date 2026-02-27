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

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

export async function POST() {
  try {
    // 1. Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Plan gate (server-side, admin client)
    const planInfo = await getPlanInfo(user.id);
    if (!planInfo?.canUseMetaApi) {
      return NextResponse.json({ skipped: true, reason: "free_plan" });
    }

    // 3. Fetch candidate accounts
    const admin = createAdminClient();
    const { data: accounts } = await admin
      .from("trading_accounts")
      .select("id, account_name, last_sync_at, status")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("auto_sync_enabled", true)
      .is("deleted_at", null)
      .not("metaapi_account_id", "is", null);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ skipped: true, reason: "no_accounts" });
    }

    // 4. Cooldown filter
    const now = Date.now();
    const eligible = accounts.filter((a) => {
      if (a.status === "syncing") return false;
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
          console.error("[smart-sync] Background sync failed for", account.id, err);
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
      console.log("[smart-sync] Background sync complete for", accountIds.length, "accounts");
    };

    runSequentialSync().catch((err) =>
      console.error("[smart-sync] Sequential sync rejected:", err)
    );

    return NextResponse.json(
      { triggered: true, accounts: accountIds },
      { status: 202 }
    );
  } catch (err) {
    console.error("[smart-sync] Route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

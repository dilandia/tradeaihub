/**
 * POST /api/smart-sync
 *
 * Smart Sync — auto-sync trading accounts when user opens the dashboard.
 * Plan-gated: only Pro/Elite users trigger sync.
 * Cooldown: 3 hours per account.
 * Responds 202 immediately, syncs in background (fire-and-forget).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { getPool } from "@/lib/db";
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
    const { user } = await getServerSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Plan gate (server-side)
    const planInfo = await getPlanInfo(user.id);
    if (!planInfo?.canUseMetaApi) {
      return NextResponse.json({ skipped: true, reason: "free_plan" });
    }

    const pool = getPool();

    // 3. Fetch candidate accounts
    // When force=true (manual sync), include ALL active accounts regardless of auto_sync_enabled.
    // The auto_sync_enabled flag only gates automatic background sync, not explicit user-triggered sync.
    let accountQuery = `
      SELECT id, account_name, last_sync_at, status, updated_at
      FROM trading_accounts
      WHERE user_id = $1
        AND is_active = true
        AND deleted_at IS NULL
        AND metaapi_account_id IS NOT NULL
    `;
    const queryParams: unknown[] = [user.id];

    if (!force) {
      accountQuery += ` AND auto_sync_enabled = true`;
    }

    const { rows: accounts } = await pool.query(accountQuery, queryParams);

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
          await pool.query(
            `UPDATE trading_accounts
             SET status = 'error', error_message = $1, updated_at = $2
             WHERE id = $3`,
            ["Sync interrompido (recuperação automática)", new Date().toISOString(), a.id]
          );
          a.status = "error"; // Update in-memory too for the filter below
        }
      }
    }

    // 4. Cooldown filter (bypassed when force=true for manual sync)
    const eligible = accounts.filter((a: { status: string; last_sync_at: string | null }) => {
      if (a.status === "syncing") return false;
      if (force) return true;
      if (!a.last_sync_at) return true;
      return now - new Date(a.last_sync_at).getTime() >= THREE_HOURS_MS;
    });

    if (eligible.length === 0) {
      return NextResponse.json({ skipped: true, reason: "cooldown" });
    }

    // 5. Respond immediately (non-blocking)
    const accountIds = eligible.map((a: { id: string }) => a.id);

    // 6. Fire-and-forget: sequential background sync
    const userId = user.id;
    const runSequentialSync = async () => {
      for (const account of eligible) {
        try {
          await pool.query(
            `UPDATE trading_accounts SET status = 'syncing', updated_at = $1
             WHERE id = $2 AND user_id = $3`,
            [new Date().toISOString(), account.id, userId]
          );

          const result = await syncAccountWithMetaApi(account.id, userId);

          if (!result.success) {
            await pool.query(
              `UPDATE trading_accounts
               SET status = 'error', error_message = $1, updated_at = $2
               WHERE id = $3 AND user_id = $4`,
              [result.error ?? "Smart sync failed", new Date().toISOString(), account.id, userId]
            );
          }
          // On success, syncAccountWithMetaApi already updates status to "connected"
        } catch (err) {
          syncLogger.error({ accountId: account.id, error: err instanceof Error ? err.message : String(err) }, "Background sync failed");
          await pool.query(
            `UPDATE trading_accounts
             SET status = 'error', error_message = $1, updated_at = $2
             WHERE id = $3 AND user_id = $4`,
            ["Smart sync error", new Date().toISOString(), account.id, userId]
          );
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

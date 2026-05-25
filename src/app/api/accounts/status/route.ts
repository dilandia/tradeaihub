// src/app/api/accounts/status/route.ts
// Polling endpoint: returns status of specific trading accounts by ID.
// Used by GlobalHeader to poll sync progress without Supabase client.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { getPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { user } = await getServerSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");
  if (!ids) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });
  }

  const accountIds = ids.split(",").filter(Boolean);
  if (accountIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const pool = getPool();
  const placeholders = accountIds.map((_, i) => `$${i + 2}`).join(", ");
  const result = await pool.query(
    `SELECT id, account_name, status, error_message
     FROM trading_accounts
     WHERE user_id = $1 AND id IN (${placeholders}) AND deleted_at IS NULL`,
    [user.id, ...accountIds]
  );

  return NextResponse.json({ data: result.rows });
}

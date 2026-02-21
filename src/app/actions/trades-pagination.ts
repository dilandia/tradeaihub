/**
 * TDR-11: Server action for paginated trade fetching
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calculateOffset,
  buildPaginatedResult,
  getSafePage,
  getSafePageSize,
  PaginatedResult,
} from "@/lib/pagination";

export interface Trade {
  id: string;
  user_id: string;
  import_id: string | null;
  trading_account_id: string | null;
  date: string;
  pair: string;
  entry_price: number;
  exit_price: number;
  pips: number;
  is_win: boolean;
  profit_dollar: number | null;
  risk_reward: number | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
}

export async function getTradesPaginated(
  page: number | string | undefined,
  pageSize: number | string | undefined,
  importId?: string,
  accountId?: string,
  filterTag?: string,
  include_deleted?: boolean
): Promise<PaginatedResult<Trade>> {
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  // Safe pagination params
  const safePageSize = getSafePageSize(pageSize, 10, 100);

  // First, get total count with filters
  let countQuery = supabase
    .from("trades")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (importId) {
    countQuery = countQuery.eq("import_id", importId);
  }
  if (accountId) {
    countQuery = countQuery.eq("trading_account_id", accountId);
  }
  // Wave 2: Move tag filter to query (was client-side, causing incorrect pagination)
  if (filterTag) {
    countQuery = countQuery.contains("tags", [filterTag]);
  }
  // RLS already excludes soft-deleted rows; add explicit filter as defense-in-depth
  if (!include_deleted) {
    countQuery = countQuery.is("deleted_at", null);
  }

  const { count: totalCount, error: countError } = await countQuery;

  if (countError || totalCount === null) {
    throw new Error("Failed to fetch trade count");
  }

  // Get safe page (after knowing total count)
  const safePage = getSafePage(page, safePageSize, totalCount);
  const offset = calculateOffset(safePage, safePageSize);

  // Fetch paginated trades
  let dataQuery = supabase
    .from("trades")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .range(offset, offset + safePageSize - 1);

  if (importId) {
    dataQuery = dataQuery.eq("import_id", importId);
  }
  if (accountId) {
    dataQuery = dataQuery.eq("trading_account_id", accountId);
  }
  // Wave 2: Move tag filter to query (uses Supabase array contains operator)
  if (filterTag) {
    dataQuery = dataQuery.contains("tags", [filterTag]);
  }
  if (!include_deleted) {
    dataQuery = dataQuery.is("deleted_at", null);
  }

  const { data: trades, error: dataError } = await dataQuery;

  if (dataError) {
    throw new Error("Failed to fetch trades");
  }

  return buildPaginatedResult(trades as Trade[], totalCount, safePage, safePageSize);
}

/**
 * Get total trade count for user (excludes soft-deleted)
 */
export async function getTradeCount(
  importId?: string,
  accountId?: string
): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let query = supabase
    .from("trades")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (importId) {
    query = query.eq("import_id", importId);
  }
  if (accountId) {
    query = query.eq("trading_account_id", accountId);
  }

  const { count } = await query;
  return count || 0;
}

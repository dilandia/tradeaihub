# TDR-13: Query Optimization Strategy

**Author:** Aria (Architect Agent)
**Date:** 2026-02-21
**Status:** DRAFT -- Ready for Review
**Priority:** HIGH
**Scope:** All Supabase queries in TakeZ-Plan

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Audit Methodology](#2-audit-methodology)
3. [Findings: N+1 Query Patterns](#3-findings-n1-query-patterns)
4. [Findings: Redundant Data Loading](#4-findings-redundant-data-loading)
5. [Findings: Missing Query Optimizations](#5-findings-missing-query-optimizations)
6. [Optimization Plan: Tag Operations](#6-optimization-plan-tag-operations)
7. [Optimization Plan: Import Summary Queries](#7-optimization-plan-import-summary-queries)
8. [Optimization Plan: Account Queries](#8-optimization-plan-account-queries)
9. [Optimization Plan: Trades Page Double-Fetch](#9-optimization-plan-trades-page-double-fetch)
10. [Optimization Plan: Dashboard Layout Duplicate Fetches](#10-optimization-plan-dashboard-layout-duplicate-fetches)
11. [Optimization Plan: AI Route Full-Table Loads](#11-optimization-plan-ai-route-full-table-loads)
12. [Optimization Plan: MetaApi Sync Sequential Updates](#12-optimization-plan-metaapi-sync-sequential-updates)
13. [Optimization Plan: Plan Info Waterfall](#13-optimization-plan-plan-info-waterfall)
14. [Recommended Indexes](#14-recommended-indexes)
15. [Caching Strategy](#15-caching-strategy)
16. [Before/After Performance Estimates](#16-beforeafter-performance-estimates)
17. [Implementation Priority](#17-implementation-priority)
18. [Security Considerations](#18-security-considerations)

---

## 1. Executive Summary

This audit identified **8 categories of query inefficiency** across the TakeZ-Plan codebase, ranging from critical N+1 patterns in tag operations to redundant full-table loads on every dashboard page navigation. The most severe issues are:

| Severity | Issue | Impact | Location |
|----------|-------|--------|----------|
| CRITICAL | N+1 loop updates in `updateTag` / `deleteTag` | O(n) sequential queries per trade with matching tag | `/src/app/actions/tags.ts` |
| CRITICAL | Full-table trade load on every AI route | Loads ALL trades just to filter client-side | `/src/app/api/ai/*/route.ts` |
| HIGH | Trades page double-fetch | Fetches paginated trades AND all trades for metrics | `/src/app/(dashboard)/trades/page.tsx` |
| HIGH | Layout + Page duplicate data fetching | `getImportSummaries()` and `getUserTradingAccounts()` called in layout AND child pages | `/src/app/(dashboard)/layout.tsx` + child pages |
| HIGH | `getUserTags()` fetches all trades for counting | Scans entire trades table to count tags | `/src/app/actions/tags.ts` |
| MEDIUM | `getPlanInfo()` makes 3 sequential queries | Waterfall: plan + billing + credits | `/src/lib/plan.ts` |
| MEDIUM | MetaApi sync sequential trade updates | Loop-based individual UPDATE for zero-profit trades | `/src/lib/metaapi-sync.ts` |
| LOW | `getTradesPaginated` tag filter after pagination | Client-side tag filter on already-paginated results yields incorrect counts | `/src/app/actions/trades-pagination.ts` |

**Estimated impact:** Fixing the CRITICAL and HIGH items alone would reduce database round-trips by 60-80% on the most trafficked pages (dashboard, trades, reports) and eliminate the primary scalability bottleneck (tag operations).

---

## 2. Audit Methodology

Files audited (all files that contain Supabase queries or call functions that do):

| File | Type | Query Count |
|------|------|-------------|
| `/src/app/actions/tags.ts` | Server Action | 7+ (variable) |
| `/src/app/actions/trades.ts` | Server Action | 6 |
| `/src/app/actions/trades-pagination.ts` | Server Action | 3 |
| `/src/app/actions/trading-accounts.ts` | Server Action | 12 |
| `/src/app/actions/trade-settings.ts` | Server Action | 3 |
| `/src/app/actions/profile.ts` | Server Action | 4 |
| `/src/lib/trades.ts` | Library | 5 |
| `/src/lib/trading-accounts.ts` | Library | 2 |
| `/src/lib/plan.ts` | Library | 5 |
| `/src/lib/metaapi-sync.ts` | Library | 8+ (variable) |
| `/src/lib/ai/cache.ts` | Library | 2 |
| `/src/lib/ai/copilot-conversations.ts` | Library | 6 |
| `/src/lib/ai/plan-gate.ts` | Library | 2 (delegates) |
| `/src/app/api/ai/insights/route.ts` | API Route | 1 (delegates) |
| `/src/app/api/ai/copilot/route.ts` | API Route | 1 (delegates) |
| `/src/app/api/ai/report-summary/route.ts` | API Route | 1 (delegates) |
| `/src/app/(dashboard)/layout.tsx` | Page | 3 |
| `/src/app/(dashboard)/dashboard/page.tsx` | Page | 3 |
| `/src/app/(dashboard)/trades/page.tsx` | Page | 3 |
| `/src/app/(dashboard)/reports/*/page.tsx` | Pages (10) | 1 each |

Pattern detection criteria:
- **N+1:** Any loop that issues individual queries per iteration
- **Redundant fetch:** Same data fetched in multiple places during a single request lifecycle
- **Full-table scan:** `SELECT *` without pagination or column restriction on large tables
- **Sequential where parallel is possible:** Queries that could run in `Promise.all()` but run sequentially
- **Missing server-side filtering:** Filtering that happens in application code instead of SQL

---

## 3. Findings: N+1 Query Patterns

### 3.1 CRITICAL: `updateTag()` -- N+1 trade updates

**File:** `/src/app/actions/tags.ts`, lines 137-151

**Current behavior:**
```
1. SELECT name FROM user_tags WHERE id = $id          -- 1 query
2. UPDATE user_tags SET name = $new WHERE id = $id     -- 1 query
3. SELECT id, tags FROM trades WHERE contains(tags, [oldName])  -- 1 query
4. FOR EACH trade:
     UPDATE trades SET tags = $updated WHERE id = $tradeId  -- N queries
```

**Worst case:** A user with 1,000 trades tagged "scalping" renames it to "scalp". This triggers **1,003 queries** (3 + 1,000 individual UPDATEs).

**Root cause:** Tags are stored as a `text[]` (Postgres array) column on the trades table. There is no normalized join table. To rename a tag, the code must fetch every trade containing that tag name, modify the array in JavaScript, and issue individual UPDATE statements.

### 3.2 CRITICAL: `deleteTag()` -- N+1 trade updates

**File:** `/src/app/actions/tags.ts`, lines 177-191

**Identical pattern to updateTag:** fetches all trades with the tag, then loops to remove the tag name from each trade's array column one at a time.

### 3.3 HIGH: `getUserTags()` -- full trades scan for counting

**File:** `/src/app/actions/tags.ts`, lines 35-48

**Current behavior:**
```
1. SELECT * FROM user_tags WHERE user_id = $id         -- 1 query
2. SELECT tags FROM trades WHERE user_id = $id          -- 1 query (ALL trades)
3. FOR EACH trade in JS: count tags in memory           -- O(n) in-memory
```

This fetches the `tags` column from EVERY trade belonging to the user. For a user with 5,000 trades, this transfers substantial data just to produce a count per tag.

### 3.4 MEDIUM: MetaApi sync -- sequential UPDATE for zero-profit trades

**File:** `/src/lib/metaapi-sync.ts`, lines 895-910 and 933-962

Two separate loops issue individual `UPDATE ... WHERE ticket = $ticket` statements:

```
FOR EACH trade in toUpdate:
  UPDATE trades SET profit_dollar = $val WHERE ticket = $ticket   -- N queries

FOR EACH row in zeroInDb:
  UPDATE trades SET profit_dollar = $val WHERE ticket = $ticket   -- M queries
```

**Impact:** During a sync with 50 zero-profit corrections, this generates 50+ sequential UPDATE queries.

---

## 4. Findings: Redundant Data Loading

### 4.1 HIGH: Dashboard layout + child page duplicate fetches

**Layout** (`/src/app/(dashboard)/layout.tsx`, lines 18-22):
```typescript
const [summaries, tradingAccounts, userName] = await Promise.all([
  getImportSummaries(),      // Query 1: SELECT * FROM import_summaries
  getUserTradingAccounts(),   // Query 2: SELECT ... FROM trading_accounts
  getUserFirstName(),         // Query 3: SELECT full_name FROM profiles
]);
```

**Dashboard page** (`/src/app/(dashboard)/dashboard/page.tsx`, lines 25-29):
```typescript
const [summaries, trades, tradingAccounts] = await Promise.all([
  getImportSummaries(),      // DUPLICATE of layout Query 1
  getTrades(...),            // Query 4: SELECT * FROM trades
  getUserTradingAccounts(),  // DUPLICATE of layout Query 2
]);
```

**Result:** When a user navigates to `/dashboard`, `getImportSummaries()` and `getUserTradingAccounts()` each execute TWICE -- once in the layout and once in the page. Next.js Server Components do NOT automatically deduplicate across layout and page boundaries for Supabase calls (Supabase client uses cookies, which bypasses the fetch cache).

**Same pattern repeats** for `/import` page (calls `getImportSummaries()` again).

### 4.2 HIGH: Trades page double-fetch

**File:** `/src/app/(dashboard)/trades/page.tsx`, lines 29-33

```typescript
const paginatedResult = await getTradesPaginated(page, pageSize, ...);  // Paginated SELECT
const allTrades = await getTrades(...);                                   // SELECT * (ALL trades)
const metrics = computeMetrics(allTrades);                                // In-memory calc
```

The page fetches paginated trades for display AND then fetches ALL trades a second time just to compute aggregate metrics. For a user with 5,000 trades, this means the metrics calculation loads the entire dataset from Supabase into memory.

### 4.3 MEDIUM: `getTradesPaginated` -- double query for count + data

**File:** `/src/app/actions/trades-pagination.ts`, lines 57-93

The function issues two separate queries:
1. `SELECT *, count: exact, head: true` for total count
2. `SELECT *, count: exact` with `.range()` for actual data

The second query already includes `count: "exact"` which returns the total count as a header, making the first count-only query redundant.

---

## 5. Findings: Missing Query Optimizations

### 5.1 MEDIUM: `getPlanInfo()` -- 3-query waterfall hidden behind Promise.all

**File:** `/src/lib/plan.ts`, lines 149-153

```typescript
const [plan, billingInterval, credits] = await Promise.all([
  getUserPlan(userId),            // SELECT plan, status FROM subscriptions
  getUserBillingInterval(userId), // SELECT billing_interval FROM subscriptions
  getUserAiCredits(userId),       // SELECT ... FROM ai_credits
]);
```

While this uses `Promise.all`, two of the three calls (`getUserPlan` and `getUserBillingInterval`) query the SAME `subscriptions` table for the SAME user. These should be a single query that selects both `plan, status, billing_interval`.

### 5.2 LOW: Tag filter applied client-side after pagination

**File:** `/src/app/actions/trades-pagination.ts`, lines 100-106

```typescript
let filteredTrades = (trades as Trade[]) || [];
if (filterTag) {
  filteredTrades = filteredTrades.filter((t) => t.tags?.includes(filterTag));
}
```

The tag filter is applied AFTER pagination. If page 1 has 20 trades and only 5 have the tag, the user sees 5 results on a page that should show 20. The count is also wrong because it was computed before filtering.

### 5.3 MEDIUM: `SELECT *` on wide tables

Several queries use `SELECT *` on the `trades` table which has 15+ columns, and on `import_summaries` which has 30+ columns. In contexts where only a few columns are needed (e.g., metrics computation needs only `pips`, `is_win`, `profit_dollar`, `risk_reward`, `trade_date`), the full row fetch transfers unnecessary data.

---

## 6. Optimization Plan: Tag Operations

### 6.1 Replace N+1 with Postgres Function (RPC)

**Target:** `updateTag()` and `deleteTag()` in `/src/app/actions/tags.ts`

**Recommendation:** Create a Postgres RPC function that performs the array element rename/removal atomically using `array_replace()` or `array_remove()`:

```sql
-- Rename tag in all trades atomically
CREATE OR REPLACE FUNCTION rename_tag_in_trades(
  p_user_id UUID,
  p_old_name TEXT,
  p_new_name TEXT
) RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE trades
  SET tags = array_replace(tags, p_old_name, p_new_name),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND p_old_name = ANY(tags);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove tag from all trades atomically
CREATE OR REPLACE FUNCTION remove_tag_from_trades(
  p_user_id UUID,
  p_tag_name TEXT
) RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE trades
  SET tags = array_remove(tags, p_tag_name),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND p_tag_name = ANY(tags);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Before:** N+1 queries (fetch all trades, loop, individual UPDATE per trade)
**After:** 1 RPC call (single UPDATE statement server-side)

**Performance gain:** For a user with 500 tagged trades, this reduces 503 round-trips to 1.

### 6.2 Replace full-table scan tag counting with Postgres Function

**Target:** `getUserTags()` in `/src/app/actions/tags.ts`

**Recommendation:** Create an RPC that uses `unnest()` to count tags efficiently:

```sql
CREATE OR REPLACE FUNCTION get_user_tag_counts(p_user_id UUID)
RETURNS TABLE(tag_name TEXT, trade_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.tag_name, COUNT(*) as trade_count
  FROM trades, unnest(tags) AS t(tag_name)
  WHERE user_id = p_user_id
    AND tags IS NOT NULL
    AND array_length(tags, 1) > 0
  GROUP BY t.tag_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Before:** `SELECT tags FROM trades WHERE user_id = $id` (fetches ALL trade rows, counts in JS)
**After:** 1 RPC call (aggregate in Postgres, returns only `{tag_name, count}` pairs)

**Performance gain:** Eliminates transfer of entire trades table to client. For 5,000 trades with 10 unique tags, response payload drops from ~500KB to ~0.5KB.

### 6.3 Trade-off Analysis

| Approach | Pros | Cons |
|----------|------|------|
| RPC functions (recommended) | Single round-trip, atomic, uses Postgres native array functions, no data transfer overhead | Requires Supabase migration, logic lives in DB, testing is more complex |
| Batch UPDATE with `IN` clause | Simpler, no migration needed | Still requires fetching trade IDs first, 2 queries instead of N |
| Normalized tag join table | Eliminates array manipulation entirely, standard SQL joins | Large migration effort, breaks existing import/export code, schema change |

**Decision:** RPC functions offer the best ratio of effort to impact. A normalized join table would be ideal long-term but is out of scope for TDR-13.

---

## 7. Optimization Plan: Import Summary Queries

### 7.1 Eliminate duplicate layout/page fetches

**Target:** `/src/app/(dashboard)/layout.tsx` and child pages

**Recommendation:** Fetch shared data ONLY in the layout and pass it to children via React Server Component patterns. Two approaches:

**Approach A: Props drilling via searchParams + cache (recommended)**

Use Next.js `unstable_cache` (or React `cache()`) to ensure that `getImportSummaries()` and `getUserTradingAccounts()` only execute once per request, even when called from both layout and page:

```typescript
// /src/lib/trades.ts
import { cache } from 'react';

export const getImportSummaries = cache(async (): Promise<DbImportSummary[]> => {
  const supabase = await createClient();
  // ... existing query
});
```

React's `cache()` function automatically deduplicates calls with the same arguments within a single server request.

**Apply the same pattern to:**
- `getUserTradingAccounts()` in `/src/lib/trading-accounts.ts`
- `getUserFirstName()` in `/src/lib/trades.ts`

**Approach B: Parallel slot architecture**

Use Next.js parallel routes (`@analytics`, `@sidebar`) to co-locate data needs. More complex, deferred to future refactoring.

**Before:** 6 queries per dashboard page load (3 layout + 3 page, with 2 duplicates)
**After:** 4 queries per dashboard page load (layout queries cached, page reuses)

### 7.2 Select only needed columns for layout

**Target:** `getImportSummaries()` in layout context

The layout only needs `id`, `source_filename`, `created_at`, `account_number`, `broker`, and `imported_trades_count` from the 30+ column `import_summaries` table. Create a lightweight variant:

```typescript
export const getImportSummariesLight = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("import_summaries")
    .select("id, source_filename, created_at, account_number, broker, imported_trades_count")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
});
```

**Performance gain:** Reduces payload by ~80% for the layout query (6 columns vs 30+).

---

## 8. Optimization Plan: Account Queries

### 8.1 Cache `getUserTradingAccounts()` with React `cache()`

Same approach as import summaries. Wrap with `cache()` to prevent duplicate fetches across layout and page.

### 8.2 Select only needed columns for layout

The layout only uses `id`, `account_name`, `platform`, `broker`, and `status`. The full query fetches 20+ columns including balance, equity, currency, leverage, etc.

```typescript
export const getUserTradingAccountsLight = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("trading_accounts")
    .select("id, account_name, platform, broker, status")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return data ?? [];
});
```

---

## 9. Optimization Plan: Trades Page Double-Fetch

### 9.1 Compute metrics via SQL aggregation

**Target:** `/src/app/(dashboard)/trades/page.tsx` lines 33-34

**Current:** Loads ALL trades into memory, computes metrics in JavaScript.

**Recommendation:** Create an RPC function that computes aggregate metrics directly in Postgres:

```sql
CREATE OR REPLACE FUNCTION get_trade_metrics(
  p_user_id UUID,
  p_import_id UUID DEFAULT NULL,
  p_account_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalTrades', COUNT(*),
    'wins', COUNT(*) FILTER (WHERE is_win = true),
    'losses', COUNT(*) FILTER (WHERE is_win = false),
    'netPips', COALESCE(SUM(pips), 0),
    'netDollar', COALESCE(SUM(profit_dollar), 0),
    'avgWinPips', COALESCE(AVG(ABS(pips)) FILTER (WHERE is_win = true), 0),
    'avgLossPips', COALESCE(AVG(ABS(pips)) FILTER (WHERE is_win = false), 0),
    'avgWinDollar', COALESCE(AVG(ABS(profit_dollar)) FILTER (WHERE is_win = true), 0),
    'avgLossDollar', COALESCE(AVG(ABS(profit_dollar)) FILTER (WHERE is_win = false), 0),
    'avgRiskReward', AVG(risk_reward) FILTER (WHERE risk_reward IS NOT NULL)
  ) INTO result
  FROM trades
  WHERE user_id = p_user_id
    AND (p_import_id IS NULL OR import_id = p_import_id)
    AND (p_account_id IS NULL OR trading_account_id = p_account_id);

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Before:** `SELECT * FROM trades WHERE user_id = $id` (all rows, all columns) + JS computation
**After:** 1 RPC call (Postgres computes aggregates, returns ~200 bytes of JSON)

**Performance gain:** For 5,000 trades, eliminates transfer of ~2.5MB of trade data. Postgres is orders of magnitude faster at aggregation than JavaScript.

**Note:** The `profitFactor` and `zellaScore` calculations require derived values (grossProfit/grossLoss ratio). These can be added to the RPC or computed from the returned aggregates with minimal overhead.

### 9.2 Eliminate double count query in `getTradesPaginated`

**Target:** `/src/app/actions/trades-pagination.ts`

The second query already passes `count: "exact"` which returns total count in the response. Remove the first count-only query:

```typescript
// REMOVE this:
let countQuery = supabase
  .from("trades")
  .select("*", { count: "exact", head: true })
  ...

// The data query already has count: "exact"
let dataQuery = supabase
  .from("trades")
  .select("*", { count: "exact" })
  ...

const { data: trades, count: totalCount, error } = await dataQuery;
```

**Caveat:** The current code uses the count to compute `safePage` before the data query. To eliminate the separate count query, either:
- Accept that the page number might slightly exceed total pages (and return empty data), or
- Use a single query and adjust page in the response if it is beyond bounds.

**Recommended approach:** Accept the potential empty-page edge case. The UI already handles 0 results gracefully.

### 9.3 Fix tag filtering to run server-side

**Target:** `/src/app/actions/trades-pagination.ts`, lines 100-106

Move the tag filter into the Supabase query using the `contains` operator:

```typescript
if (filterTag) {
  dataQuery = dataQuery.contains("tags", [filterTag]);
  // Also apply to countQuery if kept separate
}
```

This ensures pagination counts are correct when filtering by tag.

---

## 10. Optimization Plan: Dashboard Layout Duplicate Fetches

See Section 7.1. The `cache()` wrapping strategy addresses this for all pages under the dashboard layout.

**Additional recommendation for report pages:**

All 10 report pages (`/reports/overview`, `/reports/symbols`, `/reports/day-time`, etc.) follow an identical pattern:

```typescript
const trades = await getTrades(selectedImportId, selectedAccountId);
const calendarTrades = toCalendarTrades(trades);
```

Wrapping `getTrades()` with React `cache()` ensures that when users navigate between report tabs within the same request cycle, the trades query does not re-execute.

---

## 11. Optimization Plan: AI Route Full-Table Loads

### 11.1 Current problem

Every AI API route (`/api/ai/insights`, `/api/ai/report-summary`, `/api/ai/copilot`) calls:

```typescript
const trades = await getTrades(importId, accountId);
const calendarTrades = toCalendarTrades(trades);
const filtered = filterByDateRange(calendarTrades, period);
```

This loads ALL trades, converts them to calendar format, then filters by date range in JavaScript. For a user with 10,000 trades requesting a "30d" analysis, this loads all 10,000 trades to use ~100 of them.

### 11.2 Recommendation: Add date-range filtering at the query level

Create a new variant of `getTrades()` that accepts date filters:

```typescript
export async function getTradesByDateRange(
  startDate: string,
  endDate: string,
  importId?: string | null,
  tradingAccountId?: string | null
): Promise<DbTrade[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .gte("trade_date", startDate)
    .lte("trade_date", endDate)
    .order("trade_date", { ascending: false });

  if (importId) query = query.eq("import_id", importId);
  if (tradingAccountId) query = query.eq("trading_account_id", tradingAccountId);

  const { data } = await query;
  return (data ?? []) as DbTrade[];
}
```

Compute `startDate` from the `period` parameter (e.g., "30d" -> 30 days ago) before querying.

**Performance gain:** For "30d" period on a user with 10,000 trades across 2 years, reduces data transfer by ~95%.

### 11.3 Column restriction for AI routes

AI metric computation only needs: `trade_date`, `pair`, `pips`, `is_win`, `profit_dollar`, `risk_reward`, `entry_time`, `exit_time`, `duration_minutes`, `tags`, `id`. Exclude `user_id`, `import_id`, `trading_account_id`, `entry_price`, `exit_price`, `notes`, `created_at`, `updated_at`.

---

## 12. Optimization Plan: MetaApi Sync Sequential Updates

### 12.1 Batch UPDATE via Supabase

**Target:** `/src/lib/metaapi-sync.ts`, lines 895-910 (toUpdate loop)

Replace the sequential UPDATE loop with a batch approach using Supabase's `upsert`:

```typescript
if (toUpdate.length > 0) {
  // Build array of updates with ticket as unique key
  const updatePayloads = toUpdate.map(t => ({
    trading_account_id: tradingAccountId,
    user_id: userId,
    ticket: t.ticket,
    profit_dollar: t.profit_dollar,
    pips: t.pips,
    is_win: t.is_win,
    exit_price: t.exit_price,
    exit_time: t.exit_time,
    duration_minutes: t.duration_minutes,
  }));

  // Use RPC or batch update
  for (let i = 0; i < updatePayloads.length; i += 50) {
    const batch = updatePayloads.slice(i, i + 50);
    // Supabase does not support bulk UPDATE natively
    // Use a Postgres function for batch update
    await sb.rpc("batch_update_trade_profits", { trades: JSON.stringify(batch) });
  }
}
```

**Alternative (simpler):** If RPC is too complex, parallelize the individual updates:

```typescript
// Instead of sequential:
for (const t of toUpdate) { await sb.from("trades").update(...) }

// Use parallel batches:
const chunks = chunkArray(toUpdate, 10);
for (const chunk of chunks) {
  await Promise.all(chunk.map(t => sb.from("trades").update({...}).eq("ticket", t.ticket)));
}
```

**Before:** N sequential UPDATE queries
**After:** ceil(N/10) batches of parallel UPDATEs

---

## 13. Optimization Plan: Plan Info Waterfall

### 13.1 Merge subscription queries

**Target:** `/src/lib/plan.ts`

`getUserPlan()` and `getUserBillingInterval()` both query the `subscriptions` table. Merge into one:

```typescript
async function getSubscriptionInfo(userId: string): Promise<{
  plan: Plan;
  billingInterval: "monthly" | "annual";
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, billing_interval")
    .eq("user_id", userId)
    .single();

  if (!data || (data.status !== "active" && data.status !== "trialing")) {
    return { plan: "free", billingInterval: "monthly" };
  }

  const plan = ["pro", "elite"].includes(data.plan) ? (data.plan as Plan) : "free";
  const billingInterval = data.billing_interval === "annual" ? "annual" : "monthly";
  return { plan, billingInterval };
}
```

Then in `getPlanInfo()`:

```typescript
const [sub, credits] = await Promise.all([
  getSubscriptionInfo(userId),    // 1 query instead of 2
  getUserAiCredits(userId),       // 1 query
]);
```

**Before:** 3 queries (2 to subscriptions + 1 to ai_credits)
**After:** 2 queries (1 to subscriptions + 1 to ai_credits)

### 13.2 Cache `getPlanInfo()` with React `cache()`

Plan info rarely changes within a single request. Wrapping with `cache()` prevents multiple calls across different server actions/routes within the same request.

---

## 14. Recommended Indexes

Based on the query patterns observed, the following indexes should be verified (or created if missing):

### 14.1 Critical indexes (verify existence)

```sql
-- trades table: most-queried table
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_date ON trades(user_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_import ON trades(user_id, import_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_account ON trades(user_id, trading_account_id);
CREATE INDEX IF NOT EXISTS idx_trades_account_user ON trades(trading_account_id, user_id);

-- Tag operations (GIN index for array containment)
CREATE INDEX IF NOT EXISTS idx_trades_tags_gin ON trades USING GIN(tags);

-- MetaApi sync (ticket lookups)
CREATE INDEX IF NOT EXISTS idx_trades_account_ticket ON trades(trading_account_id, user_id, ticket);
```

### 14.2 Supporting indexes

```sql
-- import_summaries
CREATE INDEX IF NOT EXISTS idx_import_summaries_user ON import_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_import_summaries_user_created
  ON import_summaries(user_id, created_at DESC);

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- ai_credits
CREATE INDEX IF NOT EXISTS idx_ai_credits_user ON ai_credits(user_id);

-- ai_insights_cache
CREATE INDEX IF NOT EXISTS idx_ai_cache_user_key
  ON ai_insights_cache(user_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires
  ON ai_insights_cache(expires_at);

-- ai_copilot_conversations
CREATE INDEX IF NOT EXISTS idx_copilot_conv_user
  ON ai_copilot_conversations(user_id, updated_at DESC);

-- ai_copilot_messages
CREATE INDEX IF NOT EXISTS idx_copilot_msg_conv
  ON ai_copilot_messages(conversation_id, created_at ASC);

-- user_tags
CREATE INDEX IF NOT EXISTS idx_user_tags_user ON user_tags(user_id);

-- trading_accounts
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_active
  ON trading_accounts(user_id) WHERE is_active = true;

-- user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
```

### 14.3 GIN index for tags (critical for tag operations)

The `idx_trades_tags_gin` index is essential for the `contains("tags", [tagName])` filter used in:
- `getUserTags()` tag counting
- `updateTag()` finding trades with a specific tag
- `deleteTag()` finding trades with a specific tag
- `getTradesPaginated()` tag filtering (after fix)

Without this GIN index, PostgreSQL must perform a sequential scan of the entire trades table for every `@>` (contains) operation.

### 14.4 Index verification query

Run this to check which recommended indexes already exist:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'trades', 'import_summaries', 'subscriptions', 'ai_credits',
  'ai_insights_cache', 'ai_copilot_conversations', 'ai_copilot_messages',
  'user_tags', 'trading_accounts', 'user_preferences'
)
ORDER BY tablename, indexname;
```

---

## 15. Caching Strategy

### 15.1 React `cache()` -- Request-level deduplication (immediate win)

| Function | Benefit |
|----------|---------|
| `getImportSummaries()` | Called 2x per dashboard page load (layout + page) |
| `getUserTradingAccounts()` | Called 2x per dashboard page load (layout + page) |
| `getUserFirstName()` | Called in layout; prevents re-fetch if child uses it |
| `getTrades()` | Called up to 2x on trades page; prevents re-fetch across report tabs |
| `getPlanInfo()` | Called in import page + AI routes; prevents re-fetch in same request |

**Implementation cost:** Add `import { cache } from 'react'` and wrap function. Zero infrastructure.

### 15.2 AI Insights cache -- Already implemented

The existing `ai_insights_cache` table in Supabase (1-hour TTL) prevents redundant OpenAI API calls. No changes needed. This is well-designed.

### 15.3 Supabase Edge Function caching (future)

For high-traffic scenarios, consider Supabase Edge Functions with CDN caching for read-heavy queries like `getImportSummaries()`. This is out of scope for TDR-13.

### 15.4 Client-side caching with SWR/React Query (future)

The current architecture uses Next.js Server Components, which limits client-side caching options. If client components need to re-fetch data (e.g., after mutations), consider adding SWR or React Query for stale-while-revalidate patterns. This is out of scope for TDR-13.

### 15.5 Trade data caching opportunities

| Data | TTL | Reasoning |
|------|-----|-----------|
| Import summaries | Request-scoped | Changes only on import/delete |
| Trading accounts | Request-scoped | Changes only on account CRUD |
| User profile | Request-scoped | Changes only on settings update |
| Plan info | Request-scoped | Changes only on subscription change |
| Trade metrics (aggregates) | 60s | Expensive to compute; trades change infrequently |
| Tag counts | Request-scoped | Changes only on trade update/tag mutation |

---

## 16. Before/After Performance Estimates

### 16.1 Dashboard page load

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| DB round-trips | 6 (3 layout + 3 page, 2 duplicates) | 4 (with `cache()`) | -33% |
| Data transferred | ~300KB (30+ col import_summaries, 20+ col accounts, all trades) | ~150KB (light selects + all trades) | -50% |
| Time estimate (100ms/query) | ~600ms | ~400ms | -33% |

### 16.2 Trades page load

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| DB round-trips | 5 (3 layout + paginated + allTrades) | 3 (cached layout + paginated + metrics RPC) | -40% |
| Data transferred | ~3MB (all trades for metrics) | ~50KB (paginated page + aggregate JSON) | -98% |
| Time estimate | ~800ms | ~300ms | -62% |

### 16.3 Tag rename (user with 500 tagged trades)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| DB round-trips | 503 (3 + 500 UPDATEs) | 3 (select old + update tag + RPC rename) | -99.4% |
| Time estimate (10ms/query) | ~5030ms | ~30ms | -99.4% |

### 16.4 AI insights route (user with 5,000 trades, "30d" period)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| DB round-trips | 3 (auth + all trades + cache check) | 3 (auth + date-filtered trades + cache check) | same |
| Data transferred | ~2.5MB (all 5,000 trades) | ~50KB (~100 trades in date range) | -98% |
| Time estimate | ~500ms | ~100ms | -80% |

### 16.5 MetaApi sync (50 zero-profit corrections)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| DB round-trips | 50 sequential UPDATEs | 5 batches of 10 parallel UPDATEs | -90% |
| Time estimate | ~500ms | ~50ms | -90% |

---

## 17. Implementation Priority

### Phase 1: Quick Wins (Low effort, high impact)

| # | Task | Effort | Impact | Files |
|---|------|--------|--------|-------|
| 1 | Wrap shared queries with `cache()` | 1h | HIGH | `trades.ts`, `trading-accounts.ts` |
| 2 | Merge `getUserPlan` + `getUserBillingInterval` | 30m | MEDIUM | `plan.ts` |
| 3 | Remove redundant count query in `getTradesPaginated` | 30m | MEDIUM | `trades-pagination.ts` |
| 4 | Move tag filter to Supabase query in pagination | 30m | LOW | `trades-pagination.ts` |
| 5 | Add date-range filtering to `getTrades` for AI routes | 1h | HIGH | `trades.ts`, AI route files |

### Phase 2: Database Functions (Medium effort, critical impact)

| # | Task | Effort | Impact | Files |
|---|------|--------|--------|-------|
| 6 | Create `rename_tag_in_trades` RPC | 2h | CRITICAL | Migration + `tags.ts` |
| 7 | Create `remove_tag_from_trades` RPC | 1h | CRITICAL | Migration + `tags.ts` |
| 8 | Create `get_user_tag_counts` RPC | 1h | HIGH | Migration + `tags.ts` |
| 9 | Create `get_trade_metrics` RPC | 2h | HIGH | Migration + `trades.ts` + `trades/page.tsx` |

### Phase 3: Index Verification and Creation (Low effort, foundational)

| # | Task | Effort | Impact | Files |
|---|------|--------|--------|-------|
| 10 | Run index verification query | 15m | -- | SQL |
| 11 | Create missing indexes (especially GIN for tags) | 1h | HIGH | Migration |

### Phase 4: Column Optimization (Low effort, incremental)

| # | Task | Effort | Impact | Files |
|---|------|--------|--------|-------|
| 12 | Create `getImportSummariesLight` for layout | 30m | MEDIUM | `trades.ts`, `layout.tsx` |
| 13 | Create `getUserTradingAccountsLight` for layout | 30m | MEDIUM | `trading-accounts.ts`, `layout.tsx` |
| 14 | Restrict columns in AI route trade queries | 30m | MEDIUM | `trades.ts` |

### Phase 5: MetaApi Sync Optimization (Medium effort, batch context)

| # | Task | Effort | Impact | Files |
|---|------|--------|--------|-------|
| 15 | Parallelize trade UPDATE loops | 1h | MEDIUM | `metaapi-sync.ts` |
| 16 | Create batch update RPC (optional) | 2h | MEDIUM | Migration + `metaapi-sync.ts` |

**Total estimated effort:** ~15 hours across all 5 phases.

---

## 18. Security Considerations

### 18.1 RPC functions must use `SECURITY DEFINER`

All proposed RPC functions MUST:
- Include `WHERE user_id = p_user_id` to enforce row-level security
- Be created with `SECURITY DEFINER` and owned by a service role
- Validate input parameters (e.g., non-null user_id)

### 18.2 RLS policies must cover new query patterns

Any new columns added to SELECT statements or new query patterns must be covered by existing RLS policies. Verify that:
- `trades` table has `SELECT` policy: `auth.uid() = user_id`
- `import_summaries` table has `SELECT` policy: `auth.uid() = user_id`
- New RPC functions bypass RLS (they use `SECURITY DEFINER`), so they MUST enforce user_id filtering internally

### 18.3 Batch operations must preserve user isolation

The proposed batch UPDATE operations (MetaApi sync, tag rename) must ALWAYS include `user_id` in the WHERE clause to prevent cross-user data modification. This is already the case in all current code and must be maintained.

### 18.4 Sensitive data exclusion

The `SAFE_SELECT` pattern in `trading-accounts.ts` correctly excludes `password_encrypted`. This pattern must be maintained in any new query variants. The proposed `getUserTradingAccountsLight` naturally excludes this field.

---

*Document generated by Aria (Architect Agent) for TDR-13*
*This is an analysis-only document. No code changes have been made.*

# Wave 2 Phase 2: N+1 Elimination - Technical Implementation Spec

**Target:** @dev (Dex) | **Effort:** ~3 hours | **Status:** Ready for Implementation

---

## 📋 Task Breakdown

### TASK 1: Create SQL Migration for RPC Consolidation (45min)

**File:** `supabase/migrations/20260221_wave2_phase2_rpc_consolidation.sql`

```sql
-- W2-02: Consolidate tag metadata + analytics into single RPC
-- Eliminates 2-query pattern in getUserTags()

BEGIN;

CREATE OR REPLACE FUNCTION public.get_user_tags_with_counts(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  color text,
  description text,
  created_at timestamptz,
  trade_count integer,
  win_count integer,
  loss_count integer,
  win_rate numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Security: validate caller is the user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Access denied: user mismatch';
  END IF;

  RETURN QUERY
  WITH tag_stats AS (
    -- Unnest tags and aggregate statistics
    SELECT
      unnest(t.tags) AS tag_name_raw,
      COUNT(*)::integer AS usage_count,
      COUNT(CASE WHEN t.is_win THEN 1 END)::integer AS win_count,
      COUNT(CASE WHEN NOT t.is_win THEN 1 END)::integer AS loss_count
    FROM trades t
    WHERE t.user_id = p_user_id
      AND t.deleted_at IS NULL
    GROUP BY tag_name_raw
  )
  SELECT
    ut.id,
    ut.name,
    ut.color,
    ut.description,
    ut.created_at,
    COALESCE(ts.usage_count, 0),
    COALESCE(ts.win_count, 0),
    COALESCE(ts.loss_count, 0),
    CASE
      WHEN ts.usage_count > 0
      THEN ROUND(ts.win_count::numeric / ts.usage_count::numeric * 100, 2)
      ELSE 0
    END AS win_rate
  FROM user_tags ut
  LEFT JOIN tag_stats ts ON ut.name = ts.tag_name_raw
  WHERE ut.user_id = p_user_id
  ORDER BY ut.name ASC;
END;
$$;

COMMENT ON FUNCTION public.get_user_tags_with_counts(uuid) IS
  'W2-02: Returns tags with metadata and analytics (trade counts, win rate) in single query. '
  'Consolidates getUserTags() pattern: was 2 queries now 1.';

GRANT EXECUTE ON FUNCTION public.get_user_tags_with_counts(uuid) TO authenticated;

COMMIT;
```

**Rollback:**
```sql
DROP FUNCTION IF EXISTS public.get_user_tags_with_counts(uuid);
```

---

### TASK 2: Create SQL Migration for Indexes (30min)

**File:** `supabase/migrations/20260221_wave2_phase2_indexing.sql`

```sql
-- W2-02: Add missing indexes for tag and trade queries
-- Target: Query execution 40-60% faster

BEGIN;

-- Composite index for trades: common WHERE pattern (user_id + deleted_at)
CREATE INDEX IF NOT EXISTS idx_trades_user_id_deleted_at
  ON trades(user_id, deleted_at DESC)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_trades_user_id_deleted_at IS
  'Composite index for fast filtering: user trades that are not deleted. '
  'Used by: get_trades_with_tags, tag_analytics queries.';

-- Index for user_tags lookup
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id_name
  ON user_tags(user_id, name)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_user_tags_user_id_name IS
  'Fast lookup: user tags by name. Used by: tag validation, tag details queries.';

-- Verify indexes (informational)
-- ANALYZE trades;
-- ANALYZE user_tags;

COMMIT;
```

**Rollback:**
```sql
DROP INDEX IF EXISTS idx_trades_user_id_deleted_at;
DROP INDEX IF EXISTS idx_user_tags_user_id_name;
```

---

### TASK 3: Update `getUserTags()` Action (20min)

**File:** `src/app/actions/tags.ts`

**Old Code (lines 19-56):**
```typescript
export async function getUserTags(): Promise<UserTag[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: tags } = await supabase
    .from("user_tags")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (!tags) return [];

  // Query 1: ← tags SELECT
  const { data: tagCounts } = await supabase.rpc(
    "get_user_tag_counts",
    { p_user_id: user.id }
  ); // Query 2: ← RPC get_user_tag_counts

  const countMap = new Map<string, number>();
  if (tagCounts) {
    for (const row of tagCounts as Array<{ tag_name: string; tag_count: number }>) {
      countMap.set(row.tag_name, row.tag_count);
    }
  }

  return tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color ?? "#7C3AED",
    description: t.description ?? null,
    created_at: t.created_at,
    trade_count: countMap.get(t.name) ?? 0,
  }));
}
```

**New Code (replace entire function):**
```typescript
export async function getUserTags(): Promise<UserTag[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Single RPC call: returns tags with counts + analytics
  // Query 1: ← get_user_tags_with_counts (consolidates previous 2 queries)
  const { data: tags, error } = await supabase.rpc(
    "get_user_tags_with_counts",
    { p_user_id: user.id }
  );

  if (error) {
    console.error("[tags] getUserTags error:", error.message);
    return [];
  }

  if (!tags) return [];

  return tags.map((t: any) => ({
    id: t.id,
    name: t.name,
    color: t.color ?? "#7C3AED",
    description: t.description ?? null,
    created_at: t.created_at,
    trade_count: t.trade_count ?? 0,
  }));
}
```

**Changes:**
- ✅ Removed 2-query pattern
- ✅ Single RPC call
- ✅ Removed client-side count mapping logic
- ✅ Added error handling

**Testing:**
```bash
# Navigate to Settings > Tags page
# Should load instantly (vs current 1-2s delay)
# Verify tags display with counts
```

---

### TASK 4: Create `getTradesWithTags()` Action (25min)

**File:** `src/app/actions/trades.ts` (new or extend existing)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export type TradeWithTagDetails = {
  id: string;
  trade_date: string;
  pair: string;
  entry_price: number;
  exit_price: number;
  pips: number;
  is_win: boolean;
  risk_reward: number | null;
  tags: string[];
  notes: string | null;
  import_id: string | null;
  trading_account_id: string | null;
  entry_time: string | null;
  exit_time: string | null;
  duration_minutes: number | null;
  profit_dollar: number | null;
  created_at: string;
  updated_at: string;
  tag_details: Array<{
    name: string;
    color: string;
    description: string | null;
  }>;
};

/**
 * Get trades with enriched tag metadata (color, description) in single query.
 * Eliminates N+1 when displaying trades with tag details.
 *
 * Before: 50 trades = 1 query + loop to fetch tag metadata (50+ queries)
 * After:  50 trades = 1 RPC call returns everything
 */
export async function getTradesWithTags(
  importId?: string,
  accountId?: string
): Promise<TradeWithTagDetails[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Single RPC: returns trades with tag_details enrichment
  const { data: trades, error } = await supabase.rpc(
    "get_trades_with_tags",
    {
      p_user_id: user.id,
      p_import_id: importId || null,
      p_account_id: accountId || null,
    }
  );

  if (error) {
    console.error("[trades] getTradesWithTags error:", error.message);
    return [];
  }

  if (!trades) return [];

  return trades as TradeWithTagDetails[];
}
```

**Usage in Components:**

**Before (Recent Trades Table):**
```typescript
const { data: trades } = await getTrades();
const tagMetadata = await Promise.all(
  trades.flatMap(t => t.tags.map(tag => getUserTagByName(tag)))
); // ← N+1 pattern
```

**After:**
```typescript
const trades = await getTradesWithTags();
// trades already includes tag_details array
```

---

### TASK 5: Update Recent Trades Table Component (20min)

**File:** `src/components/dashboard/recent-trades-table.tsx`

**Changes:**
1. Import new action: `import { getTradesWithTags } from "@/app/actions/trades";`
2. Replace data fetch: `const trades = await getTradesWithTags();`
3. Update tag rendering to use `trade.tag_details` instead of separate lookups
4. Remove any tag metadata fetch loops

---

### TASK 6: Testing & Verification (40min)

**Step 6.1: Database Migration Testing**
```bash
# Run migrations
npm run supabase:migration:run

# Verify RPCs created
psql -c "\df public.get_user_tags_with_counts"
psql -c "\df public.get_trades_with_tags"

# Verify indexes created
psql -c "\di" | grep "idx_trades_user_id_deleted_at"
```

**Step 6.2: Query Execution Verification**
```bash
# Before optimization
EXPLAIN ANALYZE SELECT * FROM user_tags WHERE user_id = '<user-id>';
EXPLAIN ANALYZE SELECT * FROM trades WHERE user_id = '<user-id>' AND deleted_at IS NULL;

# After optimization (should show index usage)
EXPLAIN ANALYZE SELECT * FROM public.get_user_tags_with_counts('<user-id>');
EXPLAIN ANALYZE SELECT * FROM public.get_trades_with_tags('<user-id>', NULL, NULL);
```

**Step 6.3: Application Testing**
```
1. Login to app
2. Navigate to Settings > Tags
   - Verify tags load instantly
   - Check tag counts are correct
   - No duplicate queries in Network tab

3. Navigate to Dashboard
   - Load Recent Trades section
   - Verify tag colors/descriptions show (from tag_details)
   - Single network request for trades (no N+1)

4. Create/update/delete tags
   - Operations should feel snappy
   - Trade counts should update correctly
```

**Step 6.4: Performance Metrics**
```
Measure (before vs after):
- getUserTags() response time
- Dashboard load time
- Database connections per user
- CPU usage spike during load

Target: 50-75% improvement
```

---

## 📊 Files to Change

| File | Type | Changes | Est. Time |
|------|------|---------|-----------|
| `supabase/migrations/20260221_wave2_phase2_rpc_consolidation.sql` | New | Create new RPC | 15min |
| `supabase/migrations/20260221_wave2_phase2_indexing.sql` | New | Create indexes | 10min |
| `src/app/actions/tags.ts` | Update | Replace getUserTags() | 10min |
| `src/app/actions/trades.ts` | New/Extend | Add getTradesWithTags() | 15min |
| `src/components/dashboard/recent-trades-table.tsx` | Update | Use new action | 10min |
| Other trade components | Update | Use new action | 5-10min |

---

## ✅ Acceptance Criteria

- [ ] SQL migrations created and tested locally
- [ ] getUserTags() uses single RPC call (not 2)
- [ ] getTradesWithTags() action created and tested
- [ ] Recent Trades component uses new action
- [ ] No N+1 queries in Chrome DevTools Network tab
- [ ] Tag operations feel instant (<200ms)
- [ ] All tests pass (if applicable)
- [ ] Build succeeds

---

## 🚀 Deployment Steps

1. **Create migrations locally** → Test with `npm run supabase:migration:run`
2. **Update actions** → Update `tags.ts` and `trades.ts`
3. **Update components** → Use new `getTradesWithTags()` action
4. **Test thoroughly** → Verify no N+1 in Network tab
5. **Build & commit** → `npm run build && git add && git commit`
6. **Push to @github-devops** → Ready for deployment

---

**Ready for implementation!** 🚀

— Aria, arquitetando o futuro 🏗️

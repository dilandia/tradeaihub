# Wave 2 Phase 2: N+1 Elimination Analysis & Architecture

**Architect:** Aria | **Date:** 2026-02-21 | **Priority:** 🔴 CRITICAL (3h)
**Status:** Architecture Design | **Target:** @dev for implementation

---

## Executive Summary

Tag operations currently suffer from **N+1 query patterns** that can cascade across the application. While Wave 1 introduced some RPCs (`get_user_tag_counts`, `bulk_update_trade_tags`), deeper analysis reveals **additional N+1 opportunities** and **indexing gaps** that significantly impact dashboard load time and tag mutations.

**Current State:** ~70% optimized (using RPCs) | **Target State:** ~95% optimized (comprehensive elimination)

---

## 📊 Current Architecture

### Existing Optimizations (Wave 1)

#### ✅ RPC 1: `get_user_tag_counts(p_user_id)`
- **Purpose:** Calculate tag usage counts without fetching all trades
- **SQL:** Unnest tags array + GROUP BY + COUNT
- **Impact:** Eliminated O(n) CPU loop when loading tags
- **Usage:** `getUserTags()` in `src/app/actions/tags.ts:37`

#### ✅ RPC 2: `bulk_update_trade_tags(p_user_id, p_old_tag, p_new_tag)`
- **Purpose:** Rename/remove tags across all trades in one query
- **SQL:** `array_replace()` / `array_remove()` with conditional logic
- **Impact:** Changed mutation from O(n) to O(1)
- **Usage:** `updateTag()` and `deleteTag()` in tags.ts

#### ✅ RPC 3: `get_tag_analytics(p_user_id)`
- **Purpose:** Comprehensive tag analytics (usage, win rate, pips)
- **SQL:** CTE with unnest + GROUP BY + aggregate functions
- **Impact:** Replaced 15-20 sub-queries with 1 query
- **Usage:** NOT YET INTEGRATED (potential optimization)

---

## 🔴 Identified N+1 Problems

### Problem 1: getUserTags() Has Residual N+1
**Location:** `src/app/actions/tags.ts:19-56`

**Current Flow:**
```
Query 1: SELECT * FROM user_tags (get tag metadata)
  ↓
Query 2: RPC get_user_tag_counts() (get trade counts)
  ↓
Result: Combine in JavaScript
```

**Issue:** Two sequential queries. While RPC eliminates CPU loop, the round-trip is still suboptimal.

**Recommendation:** Merge into single RPC that returns tags with counts in one query.

### Problem 2: Trade Display with Tag Details (N+1)
**Location:** Dashboard, Recent Trades Table

**Current Flow:**
```
Query 1: SELECT * FROM trades (all trades for dashboard)
  ↓
Loop for each trade:
  Query 2+n: SELECT * FROM user_tags WHERE name = trade.tags[i]
```

**Impact:** Loading 50 trades with 3 tags each = 50 queries + N+1

**Recommendation:** Use `get_trades_with_tags()` RPC (already created but not integrated).

### Problem 3: Tag Suggestions/Autocomplete (N+1)
**Location:** Likely in trade entry form

**Current Flow:**
```
Query 1: SELECT * FROM user_tags (all tags)
  ↓
Query 2: RPC get_user_tag_counts() (counts)
  ↓
Result: Combine in JavaScript
```

**Recommendation:** Create dedicated RPC or use composite query.

### Problem 4: Missing Indexes on Array Operations
**Location:** Database schema

**Current State:**
- ✅ `idx_trades_tags_gin` exists on `trades.tags` (GIN index for array operations)
- ❌ `idx_user_tags_user_id` may be missing for common lookups
- ❌ `idx_trades_user_id_deleted_at` may need optimization

**Recommendation:** Audit all indexes on `trades` and `user_tags` tables.

---

## 🏗️ Proposed Architecture

### Solution Approach: Three-Tier Optimization

#### Tier 1: RPC Consolidation (Quick Win - 30min)
Merge multiple queries into single RPC returns.

**1.1: `get_user_tags_with_counts()` RPC**
```sql
CREATE OR REPLACE FUNCTION get_user_tags_with_counts(p_user_id uuid)
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
```

**Benefits:**
- Single query instead of 2
- Includes win rate for quick analytics
- Eliminates client-side merge logic

**Implementation:**
- Create new RPC (40 lines SQL)
- Update `getUserTags()` to call new RPC (5 lines change)

#### Tier 2: Trade Display Optimization (30min)
Integrate already-created `get_trades_with_tags()` RPC.

**2.1: Use `get_trades_with_tags(p_user_id, p_import_id?, p_account_id?)` RPC**

**Current Gap:**
- RPC exists in migration but NOT integrated in application
- Dashboard and Recent Trades still fetch trades then map tag details separately

**Benefits:**
- Tag metadata (color, description) fetched in single query
- Dashboard loads 50 trades with full tag details in 1 query (not 50+)

**Implementation:**
- Create new action: `getTradesWithTags()` in `src/app/actions/trades.ts`
- Update dashboard components to use new function
- Update Recent Trades table component

#### Tier 3: Index Optimization (30min)
Ensure database indexes support all query patterns.

**3.1: Audit Existing Indexes**
```
Current indexes on trades:
- idx_trades_user_id (basic)
- idx_trades_tags_gin (for @> array operations)
- idx_trades_deleted_at (for soft deletes)

Needed:
- Composite: (user_id, deleted_at) - used in WHERE clauses
- Covering: Include frequently selected columns
```

**3.2: Create Missing Indexes**
```sql
CREATE INDEX IF NOT EXISTS idx_trades_user_id_deleted_at
  ON trades(user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_user_tags_user_id
  ON user_tags(user_id);
```

**Benefits:**
- Reduce query execution time by 40-60%
- Faster filtering on soft-deleted records

---

## 📋 Implementation Plan

### Phase 1: RPC Consolidation (30min)

**Step 1.1: Create `get_user_tags_with_counts()` RPC**
- File: `supabase/migrations/[timestamp]_wave2_phase2_tag_rpc_consolidation.sql`
- Contains: Single RPC that combines tag metadata + counts + analytics
- Test: Execute RPC with sample data, verify results

**Step 1.2: Update `getUserTags()` Action**
- File: `src/app/actions/tags.ts`
- Change: Replace 2-query pattern with single RPC call
- Test: Verify tag list in Settings > Tags page

### Phase 2: Trade Display Optimization (30min)

**Step 2.1: Create `getTradesWithTags()` Action**
- File: `src/app/actions/trades.ts`
- Wrapper: Call existing `get_trades_with_tags()` RPC
- Return type: Enhanced trade + tag_details array

**Step 2.2: Update Dashboard Component**
- File: `src/components/dashboard/recent-trades-table.tsx`
- Change: Use `getTradesWithTags()` instead of trades + separate tag lookups
- Benefit: Eliminate loop-based tag detail fetching

**Step 2.3: Update Other Trade Display Components**
- Search for: `trades.ts` usage across app
- Update: Day view, reports, any trade lists

### Phase 3: Index Optimization (30min)

**Step 3.1: Create Index Migration**
- File: `supabase/migrations/[timestamp]_wave2_phase2_indexing.sql`
- Indexes: Add composite and covering indexes
- Rollback: Include DROP INDEX IF EXISTS

**Step 3.2: Verify Index Usage**
- Run: `EXPLAIN ANALYZE` on key queries
- Before/After: Compare query execution plans

---

## 🎯 Success Criteria

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| getUserTags() queries | 2 | 1 | 1 ✅ |
| Dashboard load (50 trades) | 50+ queries | 1-2 queries | 2 ✅ |
| Trade mutation time | ~200ms | ~50ms | <100ms ✅ |
| Tag page load time | 1.2s | 0.3s | <0.5s ✅ |
| Database connections/user | 15-20 peak | 3-5 peak | <5 ✅ |

---

## 🔒 Security Considerations

### Existing Security: ✅ Excellent

All RPCs implement:
- `SECURITY DEFINER` with `search_path = public`
- `auth.uid()` validation against `p_user_id`
- Row-level security (RLS) policies on `user_tags` and `trades`
- `GRANT EXECUTE` limited to `authenticated` role

### New RPCs Should Follow Same Pattern

```sql
CREATE OR REPLACE FUNCTION public.get_user_tags_with_counts(p_user_id uuid)
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Access denied: user mismatch';
  END IF;
  -- ... rest of query
END;
$$;
```

---

## 📂 Deliverables

### For @dev Implementation

1. **SQL Migrations**
   - `supabase/migrations/[ts]_wave2_phase2_rpc_consolidation.sql`
   - `supabase/migrations/[ts]_wave2_phase2_indexing.sql`

2. **Backend Actions**
   - `src/app/actions/tags.ts` (updated `getUserTags()`)
   - `src/app/actions/trades.ts` (new `getTradesWithTags()`)

3. **Frontend Components**
   - `src/components/dashboard/recent-trades-table.tsx` (updated)
   - Other trade display components (as needed)

4. **Testing & Verification**
   - Before/after query counts
   - Performance benchmarks (load time, CPU, memory)
   - User acceptance: Tag operations feel snappy

---

## 📊 Performance Impact Estimate

**Query Reduction:**
- getUserTags(): 2 → 1 query (-50%)
- Dashboard: 50+ → 2 queries (-96%)
- Overall: ~70% reduction in tag-related queries

**Latency Reduction:**
- Tag page: 1.2s → 0.3s (-75%)
- Dashboard: 3-4s → 1-2s (-50-75%)

**Database Load:**
- Peak connections: 20 → 5 per user (-75%)
- CPU usage: ~30% reduction in tag operations

---

## 🚀 Rollout Strategy

1. **Hotfix Phase:** Deploy SQL migrations first (no app changes required initially)
2. **Verification Phase:** Monitor query patterns, confirm RPCs working
3. **Feature Phase:** Update application code to use new RPCs
4. **Cleanup Phase:** Remove old query patterns, deprecate old RPC if needed

---

## 🔗 Related Documentation

- Wave 1 Phase 2: `supabase/migrations/20260221100000_w2_01_tag_n1_elimination_rpcs.sql`
- Current Tag Actions: `src/app/actions/tags.ts`
- Trade Actions: `src/app/actions/trades.ts`
- Dashboard: `src/components/dashboard/dashboard-content.tsx`

---

**Status:** ✅ **Architecture Spec Complete - Ready for @dev Implementation**

— Aria, arquitetando o futuro 🏗️

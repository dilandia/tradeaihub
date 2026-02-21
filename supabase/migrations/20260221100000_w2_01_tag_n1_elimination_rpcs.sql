/**
 * W2-01: N+1 Elimination in Tag Operations
 * Wave 2, Phase 1: Three RPCs to eliminate N+1 query patterns in tag operations
 *
 * RPC 1: get_trades_with_tags() - Returns trades with enriched tag metadata (single query)
 * RPC 2: bulk_update_trade_tags() - Rename or remove tags across trades in 1 query (was O(n))
 * RPC 3: get_tag_analytics() - Dashboard analytics in 1 query (replaces 15-20 sub-queries)
 *
 * Dependencies: trades table, user_tags table, idx_trades_tags_gin (Wave 1)
 * Rollback: DROP FUNCTION IF EXISTS for each RPC
 *
 * Security: All functions are SECURITY DEFINER with search_path = public.
 *   - p_user_id is validated against the caller's auth.uid() inside each function
 *   - GRANT EXECUTE only to 'authenticated' role
 */

BEGIN;

-- ============================================================
-- RPC 1: get_trades_with_tags(p_user_id, p_import_id, p_account_id)
-- ============================================================
-- Returns trades with an enriched JSONB array of tag objects (name, color, description)
-- instead of the raw text[] tags column. Single query using LEFT JOIN LATERAL.
--
-- Before: Client fetches trades (1 query), then for each unique tag fetches user_tags
-- After:  1 query returns everything
--
-- Return type: trade columns + tag_details JSONB[]

CREATE OR REPLACE FUNCTION public.get_trades_with_tags(
  p_user_id uuid,
  p_import_id uuid DEFAULT NULL,
  p_account_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  trade_date date,
  pair text,
  entry_price numeric,
  exit_price numeric,
  pips numeric,
  is_win boolean,
  risk_reward numeric,
  tags text[],
  notes text,
  import_id uuid,
  trading_account_id uuid,
  entry_time text,
  exit_time text,
  duration_minutes numeric,
  profit_dollar numeric,
  created_at timestamptz,
  updated_at timestamptz,
  tag_details jsonb
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
  SELECT
    t.id,
    t.trade_date,
    t.pair,
    t.entry_price,
    t.exit_price,
    t.pips,
    t.is_win,
    t.risk_reward,
    t.tags,
    t.notes,
    t.import_id,
    t.trading_account_id,
    t.entry_time,
    t.exit_time,
    t.duration_minutes,
    t.profit_dollar,
    t.created_at,
    t.updated_at,
    -- Enrich tags with metadata from user_tags table
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', ut.name,
            'color', ut.color,
            'description', ut.description
          )
          ORDER BY ut.name
        )
        FROM user_tags ut
        WHERE ut.user_id = p_user_id
          AND ut.name = ANY(t.tags)
      ),
      '[]'::jsonb
    ) AS tag_details
  FROM trades t
  WHERE t.user_id = p_user_id
    AND t.deleted_at IS NULL
    AND (p_import_id IS NULL OR t.import_id = p_import_id)
    AND (p_account_id IS NULL OR t.trading_account_id = p_account_id)
  ORDER BY t.trade_date DESC;
END;
$$;

COMMENT ON FUNCTION public.get_trades_with_tags(uuid, uuid, uuid) IS
  'W2-01: Returns trades with enriched tag metadata (color, description) in a single query. '
  'Eliminates N+1 when displaying trades with tag details.';

GRANT EXECUTE ON FUNCTION public.get_trades_with_tags(uuid, uuid, uuid) TO authenticated;


-- ============================================================
-- RPC 2: bulk_update_trade_tags(p_user_id, p_old_tag, p_new_tag)
-- ============================================================
-- Renames a tag across ALL trades for a user in a single UPDATE statement.
-- When p_new_tag IS NULL, removes the tag (used by deleteTag).
--
-- Before: SELECT trades with tag -> loop through each -> UPDATE one by one (O(n))
-- After:  1 UPDATE with array_replace or array_remove (O(1))
--
-- Returns: number of trades affected

CREATE OR REPLACE FUNCTION public.bulk_update_trade_tags(
  p_user_id uuid,
  p_old_tag text,
  p_new_tag text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_affected integer;
BEGIN
  -- Security: validate caller is the user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Access denied: user mismatch';
  END IF;

  -- Validate input
  IF p_old_tag IS NULL OR trim(p_old_tag) = '' THEN
    RAISE EXCEPTION 'p_old_tag cannot be null or empty';
  END IF;

  IF p_new_tag IS NOT NULL THEN
    -- RENAME: replace old tag with new tag in the array
    UPDATE trades
    SET
      tags = array_replace(tags, p_old_tag, trim(p_new_tag)),
      updated_at = now()
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
      AND tags @> ARRAY[p_old_tag];
  ELSE
    -- DELETE: remove the tag from the array
    UPDATE trades
    SET
      tags = array_remove(tags, p_old_tag),
      updated_at = now()
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
      AND tags @> ARRAY[p_old_tag];
  END IF;

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN v_affected;
END;
$$;

COMMENT ON FUNCTION public.bulk_update_trade_tags(uuid, text, text) IS
  'W2-01: Bulk rename or remove a tag across all trades for a user in O(1). '
  'Pass p_new_tag=NULL to remove, or pass a new name to rename. '
  'Uses array_replace/array_remove instead of per-trade loop.';

GRANT EXECUTE ON FUNCTION public.bulk_update_trade_tags(uuid, text, text) TO authenticated;


-- ============================================================
-- RPC 3: get_tag_analytics(p_user_id)
-- ============================================================
-- Returns comprehensive tag analytics: tag metadata + usage stats in 1 query.
-- Supersedes get_user_tag_counts() with additional fields (last_used, win_rate).
--
-- Before: Multiple sub-queries (15-20 per dashboard load)
-- After:  1 query with GROUP BY + JOIN
--
-- Note: get_user_tag_counts() is kept for backward compatibility (getUserTags still uses it)

CREATE OR REPLACE FUNCTION public.get_tag_analytics(p_user_id uuid)
RETURNS TABLE (
  tag_id uuid,
  tag_name text,
  tag_color text,
  tag_description text,
  usage_count integer,
  win_count integer,
  loss_count integer,
  win_rate numeric,
  total_pips numeric,
  avg_pips numeric,
  last_used date,
  first_used date
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
  WITH trade_tags AS (
    -- Unnest the tags array to get one row per trade-tag combination
    SELECT
      t.id AS trade_id,
      t.is_win,
      t.pips,
      t.trade_date,
      unnest(t.tags) AS tag_name_raw
    FROM trades t
    WHERE t.user_id = p_user_id
      AND t.deleted_at IS NULL
      AND array_length(t.tags, 1) > 0
  ),
  tag_stats AS (
    -- Aggregate per tag_name
    SELECT
      tt.tag_name_raw,
      COUNT(*)::integer AS usage_count,
      COUNT(CASE WHEN tt.is_win THEN 1 END)::integer AS win_count,
      COUNT(CASE WHEN NOT tt.is_win THEN 1 END)::integer AS loss_count,
      CASE
        WHEN COUNT(*) > 0
        THEN ROUND(COUNT(CASE WHEN tt.is_win THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2)
        ELSE 0
      END AS win_rate,
      COALESCE(SUM(tt.pips), 0)::numeric AS total_pips,
      CASE
        WHEN COUNT(*) > 0
        THEN ROUND(COALESCE(SUM(tt.pips), 0)::numeric / COUNT(*)::numeric, 2)
        ELSE 0
      END AS avg_pips,
      MAX(tt.trade_date) AS last_used,
      MIN(tt.trade_date) AS first_used
    FROM trade_tags tt
    GROUP BY tt.tag_name_raw
  )
  SELECT
    ut.id AS tag_id,
    ut.name AS tag_name,
    COALESCE(ut.color, '#7C3AED') AS tag_color,
    ut.description AS tag_description,
    COALESCE(ts.usage_count, 0)::integer AS usage_count,
    COALESCE(ts.win_count, 0)::integer AS win_count,
    COALESCE(ts.loss_count, 0)::integer AS loss_count,
    COALESCE(ts.win_rate, 0)::numeric AS win_rate,
    COALESCE(ts.total_pips, 0)::numeric AS total_pips,
    COALESCE(ts.avg_pips, 0)::numeric AS avg_pips,
    ts.last_used,
    ts.first_used
  FROM user_tags ut
  LEFT JOIN tag_stats ts ON ts.tag_name_raw = ut.name
  WHERE ut.user_id = p_user_id
  ORDER BY COALESCE(ts.usage_count, 0) DESC, ut.name ASC;
END;
$$;

COMMENT ON FUNCTION public.get_tag_analytics(uuid) IS
  'W2-01: Comprehensive tag analytics in a single query. '
  'Returns tag metadata + usage_count, win_rate, total_pips, avg_pips, last_used, first_used. '
  'Supersedes get_user_tag_counts() for dashboard analytics use cases.';

GRANT EXECUTE ON FUNCTION public.get_tag_analytics(uuid) TO authenticated;


-- ============================================================
-- ANALYZE: Update statistics for query planner
-- ============================================================

ANALYZE public.trades;
ANALYZE public.user_tags;

COMMIT;

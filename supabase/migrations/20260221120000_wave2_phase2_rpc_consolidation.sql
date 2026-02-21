-- W2-P2: Consolidate tag metadata + analytics into single RPC
-- Eliminates 2-query pattern in getUserTags()
-- Performance: 2 queries → 1 query (-50%)

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
  'W2-P2: Returns tags with metadata and analytics (trade counts, win rate) in single query. '
  'Consolidates getUserTags() pattern: was 2 queries now 1.';

GRANT EXECUTE ON FUNCTION public.get_user_tags_with_counts(uuid) TO authenticated;

COMMIT;

/**
 * RPC function para calcular contagem de tags por usuário.
 * Executa agregação na database ao invés de buscar 500+ trades e loopear em CPU.
 * Wave 1, Phase 2: N+1 Prevention
 */

CREATE OR REPLACE FUNCTION public.get_user_tag_counts(p_user_id uuid)
RETURNS TABLE (tag_name text, tag_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT
    tag_name,
    COUNT(*)::integer as tag_count
  FROM (
    SELECT
      unnest(t.tags) as tag_name
    FROM trades t
    WHERE t.user_id = p_user_id
      AND t.deleted_at IS NULL
  ) tagged_trades
  GROUP BY tag_name
  ORDER BY tag_name ASC
$$;

GRANT EXECUTE ON FUNCTION public.get_user_tag_counts(uuid) TO authenticated;

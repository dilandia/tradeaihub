/**
 * ROLLBACK: W2-01 N+1 Elimination in Tag Operations
 *
 * Drops the 3 RPCs created by 20260221100000_w2_01_tag_n1_elimination_rpcs.sql
 * Safe to run multiple times (IF EXISTS).
 *
 * NOTE: This does NOT affect existing data. Tags in trades remain unchanged.
 * The application code (tags.ts) must revert to the N+1 loop pattern
 * if this rollback is applied.
 */

BEGIN;

-- Drop RPC 1: get_trades_with_tags
DROP FUNCTION IF EXISTS public.get_trades_with_tags(uuid, uuid, uuid);

-- Drop RPC 2: bulk_update_trade_tags
DROP FUNCTION IF EXISTS public.bulk_update_trade_tags(uuid, text, text);

-- Drop RPC 3: get_tag_analytics
DROP FUNCTION IF EXISTS public.get_tag_analytics(uuid);

COMMIT;

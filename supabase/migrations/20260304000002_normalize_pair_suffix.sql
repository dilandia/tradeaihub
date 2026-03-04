-- Migration: Normalize broker pair suffixes (.c)
-- Description: Some brokers configure instruments with liquidity suffixes in MetaAPI
--   (e.g., XAUUSD.c, EURUSD.c, USDCAD.c). This causes pair fragmentation in
--   analytics RPCs that filter by exact pair name.
-- Affected: 285 trades across 2 users, all source='sync'
-- Pairs normalized: XAUUSD.c -> XAUUSD, EURUSD.c -> EURUSD, USDCAD.c -> USDCAD
-- Safe: only updates text values in pair column, no schema changes
-- Idempotent: running twice has no effect (second run matches 0 rows)
-- Rollback: Not needed (data correction, no schema change). If needed, there is
--   no way to distinguish previously-suffixed trades without a backup.
-- Date: 2026-03-04

-- Remove .c suffix from sync trades only
-- Only affects source='sync' (MetaAPI origin) to preserve any manual imports
UPDATE public.trades
SET pair = REPLACE(pair, '.c', '')
WHERE pair LIKE '%.c'
  AND source = 'sync'
  AND deleted_at IS NULL;

-- Wave 1 Phase 4: Database Indexing Strategy
-- Migration file: 20260221_wave1_phase4_indexing.sql
-- Objetivo: Otimizar queries frequentes em produção
-- Criado em: 2026-02-21

-- ===== INDEX 1: GIN INDEX PARA TRADES.TAGS =====
-- Otimiza: .contains("tags", ["PATTERN"]) - usado em getUserTags RPC
CREATE INDEX IF NOT EXISTS idx_trades_tags_gin 
  ON public.trades USING GIN(tags);

COMMENT ON INDEX idx_trades_tags_gin IS 
  'GIN index for fast array contains queries on trades.tags. ' ||
  'Otimiza queries como: .contains("tags", ["BUG"]) de O(n) para O(log n)';

-- ===== INDEX 2: PARTIAL INDEX - ACTIVE TRADES (user_id + trade_date) =====
-- Otimiza: SELECT * WHERE user_id = ? AND deleted_at IS NULL ORDER BY trade_date DESC
-- Esta é a query mais frequente em getTradesPaginated
CREATE INDEX IF NOT EXISTS idx_trades_active_user_date 
  ON public.trades(user_id, trade_date DESC) 
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_trades_active_user_date IS 
  'Partial index for active trades (deleted_at IS NULL). ' ||
  'Otimiza getTradesPaginated() - queries mais frequentes no sistema';

-- ===== INDEX 3: COMPOSITE INDEX (user_id, trade_date) - FULL TABLE =====
-- Para compatibilidade com admin queries que precisam ver deleted trades
CREATE INDEX IF NOT EXISTS idx_trades_user_date 
  ON public.trades(user_id, trade_date DESC);

COMMENT ON INDEX idx_trades_user_date IS 
  'Composite index without WHERE clause. Compatível com admin/debug queries';

-- ===== INDEX 4: IMPORT_ID INDEX - ACTIVE TRADES =====
-- Otimiza: soft-delete em cascata de import_summaries
CREATE INDEX IF NOT EXISTS idx_trades_import_id_active 
  ON public.trades(import_id) 
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_trades_import_id_active IS 
  'Index for fast import_id lookups. Usado em deleteImport() para soft-delete em cascata';

-- ===== VERIFICATION QUERY =====
-- Para confirmar que os índices foram criados:
-- SELECT indexname, indexdef FROM pg_indexes 
--   WHERE tablename = 'trades' AND indexname LIKE 'idx_%'
--   ORDER BY indexname;

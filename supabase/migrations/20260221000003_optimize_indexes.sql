/**
 * Índices para otimização de queries.
 * Phase 4: Indexing
 *
 * 1. GIN index em trades.tags - otimiza @> e operator de array
 * 2. Partial indexes em deleted_at - otimiza soft-delete filters
 */

-- GIN index para buscar trades por tags rapidamente
-- Usado em: getUserTags() RPC, reports/tags, trade filtering
CREATE INDEX IF NOT EXISTS idx_trades_tags_gin
  ON public.trades USING GIN (tags);

-- Partial index: Apenas trades não deletadas (mais frequentes)
-- Otimiza queries onde is("deleted_at", null) é padrão
CREATE INDEX IF NOT EXISTS idx_trades_not_deleted
  ON public.trades (user_id, trade_date DESC)
  WHERE deleted_at IS NULL;

-- Partial index: Importações não deletadas
CREATE INDEX IF NOT EXISTS idx_import_summaries_not_deleted
  ON public.import_summaries (user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Partial index: Contas ativas não deletadas
CREATE INDEX IF NOT EXISTS idx_trading_accounts_not_deleted
  ON public.trading_accounts (user_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_active = true;

-- Composite index para filtros comuns (import_id + account_id)
CREATE INDEX IF NOT EXISTS idx_trades_import_account
  ON public.trades (user_id, import_id, trading_account_id)
  WHERE deleted_at IS NULL;

-- Index para trade_date sorting (usado em quase todas queries)
CREATE INDEX IF NOT EXISTS idx_trades_user_date
  ON public.trades (user_id, trade_date DESC)
  WHERE deleted_at IS NULL;

-- Estatísticas
ANALYZE public.trades;
ANALYZE public.import_summaries;
ANALYZE public.trading_accounts;

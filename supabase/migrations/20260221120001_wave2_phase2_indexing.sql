-- W2-P2: Add missing indexes for tag and trade queries
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
  ON user_tags(user_id, name);

COMMENT ON INDEX idx_user_tags_user_id_name IS
  'Fast lookup: user tags by name. Used by: tag validation, tag details queries.';

COMMIT;

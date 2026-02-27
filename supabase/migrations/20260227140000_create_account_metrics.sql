-- Migration: create_account_metrics
-- Description: Stores MetaStats metrics per trading account (MetaApi integration)
-- Author: Dara (data-engineer)
-- Date: 2026-02-27
--
-- Design notes:
--   - trading_account_id has NO foreign key constraint because trading_accounts
--     is a "ghost table" (created via Supabase dashboard, no CREATE TABLE migration).
--     The application layer enforces referential integrity.
--   - Only service_role can INSERT/UPDATE/DELETE. Regular users get read-only access
--     to their own rows. This prevents any client-side manipulation of metrics data.

-- Account metrics table
CREATE TABLE IF NOT EXISTS account_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id UUID NOT NULL,  -- no FK: trading_accounts is a ghost table
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metrics_data JSONB NOT NULL,       -- full MetaStats API response
  metrics_summary JSONB,             -- extracted key metrics (sharpe, sortino, profit_factor, etc.)
  trades_count INTEGER,              -- number of trades at calculation time
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_account_metrics_trading_account UNIQUE (trading_account_id)
);

-- Indexes
CREATE INDEX idx_account_metrics_user_id ON account_metrics(user_id);
-- Note: trading_account_id already has a unique index from the UNIQUE constraint,
-- so no separate index needed for lookups by trading_account_id.

-- Row Level Security
ALTER TABLE account_metrics ENABLE ROW LEVEL SECURITY;

-- SELECT: users can read their own metrics
CREATE POLICY "Users can view own account metrics"
  ON account_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for anon/authenticated roles.
-- Only service_role (admin client) can write to this table.
-- This is intentional: metrics are computed server-side and must not
-- be modifiable by end users through the Supabase client.

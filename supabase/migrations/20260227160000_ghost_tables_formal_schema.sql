-- =============================================================================
-- Migration: 20260227160000_ghost_tables_formal_schema.sql
-- Description: Formal schema definition for 4 "ghost tables" that exist in
--              production but were never captured in migration files.
--              This is a snapshot migration — it documents the EXISTING schema
--              exactly as-is. No structural changes are made.
-- Tables: trading_accounts, import_summaries, user_tags, user_preferences
-- Author: Dara (data-engineer)
-- Date: 2026-02-27
-- Idempotent: Yes (all statements use IF NOT EXISTS)
-- Rollback: No-op (tables already exist; this migration only formalizes them)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. trading_accounts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trading_accounts (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL,
  account_name         text        NOT NULL,
  platform             text        NOT NULL,
  broker               text        NOT NULL,
  server               text        NOT NULL,
  login                text        NOT NULL,
  password_encrypted   text        NOT NULL,
  password_type        text        NOT NULL,
  metaapi_account_id   text,
  status               text        NOT NULL DEFAULT 'disconnected'::text,
  last_sync_at         timestamptz,
  sync_interval_minutes integer    NOT NULL DEFAULT 60,
  auto_sync_enabled    boolean     NOT NULL DEFAULT true,
  profit_calc_method   text        NOT NULL DEFAULT 'FIFO'::text,
  balance              numeric     NOT NULL DEFAULT 0,
  equity               numeric     NOT NULL DEFAULT 0,
  currency             text        NOT NULL DEFAULT 'USD'::text,
  leverage             integer,
  error_message        text,
  is_active            boolean     NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz,

  CONSTRAINT trading_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT trading_accounts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user
  ON public.trading_accounts USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_trading_accounts_not_deleted
  ON public.trading_accounts USING btree (user_id, created_at DESC)
  WHERE (deleted_at IS NULL AND is_active = true);

CREATE INDEX IF NOT EXISTS idx_trading_accounts_deleted_at
  ON public.trading_accounts USING btree (deleted_at)
  WHERE (deleted_at IS NOT NULL);

-- RLS
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'trading_accounts'
      AND policyname = 'Users can read own trading accounts'
  ) THEN
    CREATE POLICY "Users can read own trading accounts"
      ON public.trading_accounts FOR SELECT
      USING (auth.uid() = user_id AND deleted_at IS NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'trading_accounts'
      AND policyname = 'Users can insert own trading accounts'
  ) THEN
    CREATE POLICY "Users can insert own trading accounts"
      ON public.trading_accounts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'trading_accounts'
      AND policyname = 'Users can update own trading accounts'
  ) THEN
    CREATE POLICY "Users can update own trading accounts"
      ON public.trading_accounts FOR UPDATE
      USING (auth.uid() = user_id AND deleted_at IS NULL)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'trading_accounts'
      AND policyname = 'Users can delete own trading accounts'
  ) THEN
    CREATE POLICY "Users can delete own trading accounts"
      ON public.trading_accounts FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. import_summaries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.import_summaries (
  id                            uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id                       uuid        NOT NULL,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  source_filename               text,
  account_name                  text,
  account_number                text,
  broker                        text,
  report_date                   text,
  total_net_profit              numeric,
  gross_profit                  numeric,
  gross_loss                    numeric,
  profit_factor                 numeric,
  expected_payoff               numeric,
  recovery_factor               numeric,
  sharpe_ratio                  numeric,
  balance_drawdown_absolute     numeric,
  balance_drawdown_maximal      numeric,
  balance_drawdown_maximal_pct  numeric,
  balance_drawdown_relative_pct numeric,
  balance_drawdown_relative     numeric,
  total_trades                  integer,
  short_trades                  integer,
  short_trades_won_pct          numeric,
  long_trades                   integer,
  long_trades_won_pct           numeric,
  profit_trades                 integer,
  profit_trades_pct             numeric,
  loss_trades                   integer,
  loss_trades_pct               numeric,
  largest_profit_trade          numeric,
  largest_loss_trade            numeric,
  average_profit_trade          numeric,
  average_loss_trade            numeric,
  max_consecutive_wins          integer,
  max_consecutive_wins_money    numeric,
  max_consecutive_losses        integer,
  max_consecutive_losses_money  numeric,
  max_consecutive_profit        numeric,
  max_consecutive_profit_count  integer,
  max_consecutive_loss          numeric,
  max_consecutive_loss_count    integer,
  imported_trades_count         integer,
  deleted_at                    timestamptz,

  CONSTRAINT import_summaries_pkey PRIMARY KEY (id),
  CONSTRAINT import_summaries_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_import_summaries_user
  ON public.import_summaries USING btree (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_import_summaries_not_deleted
  ON public.import_summaries USING btree (user_id, created_at DESC)
  WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_import_summaries_deleted_at
  ON public.import_summaries USING btree (deleted_at)
  WHERE (deleted_at IS NOT NULL);

-- RLS
ALTER TABLE public.import_summaries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'import_summaries'
      AND policyname = 'Users can read own import summaries'
  ) THEN
    CREATE POLICY "Users can read own import summaries"
      ON public.import_summaries FOR SELECT
      USING (auth.uid() = user_id AND deleted_at IS NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'import_summaries'
      AND policyname = 'Users can insert own summaries'
  ) THEN
    CREATE POLICY "Users can insert own summaries"
      ON public.import_summaries FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'import_summaries'
      AND policyname = 'Users can update own import summaries'
  ) THEN
    CREATE POLICY "Users can update own import summaries"
      ON public.import_summaries FOR UPDATE
      USING (auth.uid() = user_id AND deleted_at IS NULL)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'import_summaries'
      AND policyname = 'Users can delete own summaries'
  ) THEN
    CREATE POLICY "Users can delete own summaries"
      ON public.import_summaries FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. user_tags
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_tags (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  name        text        NOT NULL,
  color       text                 DEFAULT '#7C3AED'::text,
  description text,
  created_at  timestamptz          DEFAULT now(),

  CONSTRAINT user_tags_pkey PRIMARY KEY (id),
  CONSTRAINT user_tags_user_id_name_key UNIQUE (user_id, name),
  CONSTRAINT user_tags_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_tags_user
  ON public.user_tags USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_user_tags_user_id_name
  ON public.user_tags USING btree (user_id, name);

-- RLS
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_tags'
      AND policyname = 'Users can read own tags'
  ) THEN
    CREATE POLICY "Users can read own tags"
      ON public.user_tags FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_tags'
      AND policyname = 'Users can insert own tags'
  ) THEN
    CREATE POLICY "Users can insert own tags"
      ON public.user_tags FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_tags'
      AND policyname = 'Users can update own tags'
  ) THEN
    CREATE POLICY "Users can update own tags"
      ON public.user_tags FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_tags'
      AND policyname = 'Users can delete own tags'
  ) THEN
    CREATE POLICY "Users can delete own tags"
      ON public.user_tags FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. user_preferences
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL,
  default_view_mode    text                 DEFAULT 'dollar'::text,
  default_time_range   text                 DEFAULT '30d'::text,
  profit_calc_method   text                 DEFAULT 'FIFO'::text,
  default_chart_type   text                 DEFAULT 'area'::text,
  show_weekends        boolean              DEFAULT false,
  week_start           text                 DEFAULT 'monday'::text,
  risk_per_trade       numeric              DEFAULT 1.0,
  default_risk_reward  numeric              DEFAULT 2.0,
  max_daily_loss       numeric,
  max_daily_trades     integer,
  trading_session      text                 DEFAULT 'all'::text,
  session_start_hour   integer              DEFAULT 0,
  session_end_hour     integer              DEFAULT 23,
  created_at           timestamptz          DEFAULT now(),
  updated_at           timestamptz          DEFAULT now(),

  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_key UNIQUE (user_id),
  CONSTRAINT user_preferences_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_preferences'
      AND policyname = 'Users can read own preferences'
  ) THEN
    CREATE POLICY "Users can read own preferences"
      ON public.user_preferences FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_preferences'
      AND policyname = 'Users can insert own preferences'
  ) THEN
    CREATE POLICY "Users can insert own preferences"
      ON public.user_preferences FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_preferences'
      AND policyname = 'Users can update own preferences'
  ) THEN
    CREATE POLICY "Users can update own preferences"
      ON public.user_preferences FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- COMMENTS (documentation embedded in schema)
-- ─────────────────────────────────────────────────────────────────────────────
COMMENT ON TABLE public.trading_accounts IS 'MetaAPI-linked trading accounts for automated sync';
COMMENT ON TABLE public.import_summaries IS 'MT5 report import summaries with parsed performance metrics';
COMMENT ON TABLE public.user_tags IS 'User-defined tags for categorizing trades';
COMMENT ON TABLE public.user_preferences IS 'Per-user dashboard and trading preferences (1:1 with auth.users)';

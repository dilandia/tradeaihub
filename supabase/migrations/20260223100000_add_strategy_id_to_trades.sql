-- Migration: Add strategy_id FK to trades table
-- Purpose: Link trades to strategies (playbooks) for strategy-based analytics
-- Rollback: ALTER TABLE public.trades DROP COLUMN strategy_id;

-- Add strategy_id FK to trades table (nullable — existing trades get NULL)
ALTER TABLE public.trades
  ADD COLUMN strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL;

-- Partial index for query performance (only non-null values)
CREATE INDEX idx_trades_strategy_id ON public.trades (strategy_id) WHERE strategy_id IS NOT NULL;

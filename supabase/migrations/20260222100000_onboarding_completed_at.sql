-- Add completed_at to track onboarding completion server-side
-- This enables cross-device persistence (instead of localStorage only)

alter table public.onboarding_responses
  add column if not exists completed_at timestamptz;

-- Backfill: existing rows were completed (they went through the full flow)
update public.onboarding_responses
  set completed_at = created_at
  where completed_at is null;

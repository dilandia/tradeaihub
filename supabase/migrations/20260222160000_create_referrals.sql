-- Migration: Referral Program (referral_codes, referrals)
-- Enables users to share referral links and earn AI credits.

-- =============================================================================
-- 1. Referral codes table
-- =============================================================================
CREATE TABLE public.referral_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- =============================================================================
-- 2. Referral tracking table
-- =============================================================================
CREATE TABLE public.referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded')),
  reward_type text, -- 'credits' or 'days'
  reward_amount integer, -- number of credits or days
  created_at timestamptz DEFAULT now(),
  converted_at timestamptz,
  rewarded_at timestamptz,
  UNIQUE(referred_id) -- one person can only be referred once
);

-- =============================================================================
-- 3. RLS
-- =============================================================================
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referral codes"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- =============================================================================
-- 4. Indexes
-- =============================================================================
CREATE INDEX idx_referral_codes_user ON public.referral_codes (user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes (code);
CREATE INDEX idx_referrals_referrer ON public.referrals (referrer_id, created_at DESC);
CREATE INDEX idx_referrals_referred ON public.referrals (referred_id);

-- =============================================================================
-- 5. RPC: Add referral credits (uses admin/service_role, bypasses RLS)
-- Safely adds bonus credits to a user's ai_credits row. Creates the row if needed.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.add_referral_credits(
  p_user_id uuid,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_period_end timestamptz;
BEGIN
  -- Upsert: add credits to existing row or create new one
  INSERT INTO public.ai_credits (user_id, credits_remaining, credits_used_this_period, period_start, period_end, created_at, updated_at)
  VALUES (p_user_id, p_amount, 0, v_now, v_now + interval '30 days', v_now, v_now)
  ON CONFLICT (user_id) DO UPDATE
  SET credits_remaining = ai_credits.credits_remaining + p_amount,
      updated_at = v_now;
END;
$$;

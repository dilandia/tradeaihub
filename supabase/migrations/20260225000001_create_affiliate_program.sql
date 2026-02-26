-- ============================================================
-- Affiliate Program Migration
-- Date: 2026-02-25
-- ============================================================
-- Order: affiliates → affiliate_applications → affiliate_referrals
--        → affiliate_commissions → affiliate_withdrawals
--        → RLS → indexes → RPCs
-- ============================================================

-- 1. affiliates (must be created first — referenced by applications)
CREATE TABLE public.affiliates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- May or may not be a registered user
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Affiliate identity
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  whatsapp text,

  -- Tracking
  affiliate_code text NOT NULL UNIQUE,   -- e.g. "TRADER-MIKE-A3F2"

  -- Commission config (per-affiliate, allows custom rates)
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.1500,  -- 15% default (Trade AI Hub standard)
  commission_type text NOT NULL DEFAULT 'recurring'
    CHECK (commission_type IN ('one_time', 'recurring')),

  -- Status
  is_active boolean DEFAULT true,

  -- Payout info
  crypto_wallet text,
  crypto_network text,  -- e.g. "USDT-TRC20", "USDC-ERC20"

  -- Stats (denormalized for fast reads)
  total_referrals integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  total_earned numeric(10,2) DEFAULT 0.00,
  total_paid numeric(10,2) DEFAULT 0.00,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. affiliate_applications
CREATE TABLE public.affiliate_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  full_name text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  primary_social text NOT NULL,          -- youtube, instagram, twitter, tiktok, blog, other
  social_url text,
  audience_size text,                    -- e.g. "1000-5000"
  trading_experience text,               -- yes_active, yes_occasionally, no_audience, no
  pitch text NOT NULL,

  -- Review
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,

  -- Link to created affiliate record (set on approval)
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. affiliate_referrals
CREATE TABLE public.affiliate_referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Attribution metadata
  landing_page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_hash text,  -- SHA-256 of IP (not PII)

  -- Status
  status text NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'converted', 'churned')),
  converted_at timestamptz,

  created_at timestamptz DEFAULT now(),

  UNIQUE(referred_user_id)  -- one user can only be attributed once
);

-- 4. affiliate_commissions
CREATE TABLE public.affiliate_commissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,

  stripe_payment_intent_id text,
  stripe_invoice_id text,

  payment_amount numeric(10,2) NOT NULL,
  commission_rate numeric(5,4) NOT NULL,
  commission_amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'usd',

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'refunded', 'cancelled')),

  -- Idempotency key (stripe payment_intent_id or invoice_id)
  idempotency_key text NOT NULL UNIQUE,

  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz
);

-- 5. affiliate_withdrawals
CREATE TABLE public.affiliate_withdrawals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,

  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  crypto_wallet text NOT NULL,
  crypto_network text NOT NULL,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  tx_hash text,
  admin_notes text,

  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_affiliates_code ON public.affiliates (affiliate_code);
CREATE INDEX idx_affiliates_user ON public.affiliates (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_affiliates_active ON public.affiliates (is_active) WHERE is_active = true;

CREATE INDEX idx_aff_applications_status ON public.affiliate_applications (status, created_at DESC);
CREATE INDEX idx_aff_applications_email ON public.affiliate_applications (email);

CREATE INDEX idx_aff_referrals_affiliate ON public.affiliate_referrals (affiliate_id, created_at DESC);
CREATE INDEX idx_aff_referrals_user ON public.affiliate_referrals (referred_user_id);
CREATE INDEX idx_aff_referrals_status ON public.affiliate_referrals (affiliate_id, status);

CREATE INDEX idx_aff_commissions_affiliate ON public.affiliate_commissions (affiliate_id, created_at DESC);
CREATE INDEX idx_aff_commissions_status ON public.affiliate_commissions (affiliate_id, status);
CREATE INDEX idx_aff_commissions_referral ON public.affiliate_commissions (referral_id);
CREATE INDEX idx_aff_commissions_idempotency ON public.affiliate_commissions (idempotency_key);

CREATE INDEX idx_aff_withdrawals_affiliate ON public.affiliate_withdrawals (affiliate_id, created_at DESC);
CREATE INDEX idx_aff_withdrawals_status ON public.affiliate_withdrawals (status);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

-- affiliates: read own record, update own payout info
CREATE POLICY "Affiliates can read own record"
  ON public.affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can update own payout info"
  ON public.affiliates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- affiliate_referrals: read own referrals
CREATE POLICY "Affiliates can read own referrals"
  ON public.affiliate_referrals FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- affiliate_commissions: read own commissions
CREATE POLICY "Affiliates can read own commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- affiliate_withdrawals: read own, insert own
CREATE POLICY "Affiliates can read own withdrawals"
  ON public.affiliate_withdrawals FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can insert own withdrawals"
  ON public.affiliate_withdrawals FOR INSERT
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================
-- RPCs
-- ============================================================

-- Updates denormalized total_earned when commission is recorded
CREATE OR REPLACE FUNCTION public.affiliate_record_commission(
  p_affiliate_id uuid,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliates
  SET
    total_earned = total_earned + p_amount,
    updated_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- Reverses a commission (refund scenario)
CREATE OR REPLACE FUNCTION public.affiliate_reverse_commission(
  p_affiliate_id uuid,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliates
  SET
    total_earned = GREATEST(total_earned - p_amount, 0),
    updated_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- Aggregated stats for admin dashboard
CREATE OR REPLACE FUNCTION public.admin_get_affiliate_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'total_applications', (SELECT count(*) FROM affiliate_applications),
    'pending_applications', (SELECT count(*) FROM affiliate_applications WHERE status = 'pending'),
    'total_affiliates', (SELECT count(*) FROM affiliates),
    'active_affiliates', (SELECT count(*) FROM affiliates WHERE is_active = true),
    'total_referrals', (SELECT COALESCE(sum(total_referrals), 0) FROM affiliates),
    'total_conversions', (SELECT COALESCE(sum(total_conversions), 0) FROM affiliates),
    'total_commissions_earned', (SELECT COALESCE(sum(total_earned), 0) FROM affiliates),
    'total_commissions_paid', (SELECT COALESCE(sum(total_paid), 0) FROM affiliates),
    'pending_withdrawals_count', (SELECT count(*) FROM affiliate_withdrawals WHERE status = 'pending'),
    'pending_withdrawals_amount', (SELECT COALESCE(sum(amount), 0) FROM affiliate_withdrawals WHERE status = 'pending'),
    'conversion_rate', CASE
      WHEN (SELECT COALESCE(sum(total_referrals), 0) FROM affiliates) > 0
      THEN ROUND(
        (SELECT COALESCE(sum(total_conversions), 0)::numeric FROM affiliates) /
        (SELECT COALESCE(sum(total_referrals), 0)::numeric FROM affiliates) * 100, 1
      )
      ELSE 0
    END,
    'top_affiliates', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          a.id,
          a.full_name,
          a.email,
          a.affiliate_code,
          a.total_referrals,
          a.total_conversions,
          a.total_earned,
          a.total_paid,
          a.is_active
        FROM affiliates a
        ORDER BY a.total_earned DESC
        LIMIT 10
      ) t
    ),
    'recent_applications', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          id,
          full_name,
          email,
          primary_social,
          status,
          created_at
        FROM affiliate_applications
        ORDER BY created_at DESC
        LIMIT 10
      ) t
    ),
    'pending_withdrawals', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          w.id,
          w.amount,
          w.crypto_wallet,
          w.crypto_network,
          w.status,
          w.created_at,
          a.full_name AS affiliate_name,
          a.email AS affiliate_email
        FROM affiliate_withdrawals w
        JOIN affiliates a ON a.id = w.affiliate_id
        WHERE w.status = 'pending'
        ORDER BY w.created_at ASC
        LIMIT 20
      ) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Validates balance and creates withdrawal request atomically
CREATE OR REPLACE FUNCTION public.affiliate_request_withdrawal(
  p_affiliate_id uuid,
  p_amount numeric,
  p_wallet text,
  p_network text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available numeric;
  v_total_earned numeric;
  v_total_paid numeric;
  v_pending_withdrawals numeric;
  v_withdrawal_id uuid;
BEGIN
  SELECT total_earned, total_paid
  INTO v_total_earned, v_total_paid
  FROM affiliates
  WHERE id = p_affiliate_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Affiliate not found or inactive');
  END IF;

  SELECT COALESCE(sum(amount), 0)
  INTO v_pending_withdrawals
  FROM affiliate_withdrawals
  WHERE affiliate_id = p_affiliate_id AND status IN ('pending', 'processing');

  v_available := v_total_earned - v_total_paid - v_pending_withdrawals;

  IF p_amount < 50 THEN
    RETURN json_build_object('success', false, 'error', 'Minimum withdrawal is $50');
  END IF;

  IF p_amount > v_available THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient balance',
      'available', v_available
    );
  END IF;

  INSERT INTO affiliate_withdrawals (affiliate_id, amount, crypto_wallet, crypto_network, status)
  VALUES (p_affiliate_id, p_amount, p_wallet, p_network, 'pending')
  RETURNING id INTO v_withdrawal_id;

  RETURN json_build_object('success', true, 'withdrawal_id', v_withdrawal_id);
END;
$$;

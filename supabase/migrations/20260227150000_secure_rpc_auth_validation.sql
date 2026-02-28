-- ============================================================
-- Security Hardening: RPC Auth Validation
-- Date: 2026-02-27
-- Production Checkup Items: 1.3 + 1.4
-- ============================================================
-- Problem:
--   Several SECURITY DEFINER RPCs accept arbitrary parameters without
--   verifying the caller's identity. A malicious user could call these
--   directly via .rpc() from the browser console.
--
-- Solution:
--   All these RPCs are called exclusively via service_role (admin) client
--   where auth.uid() IS NULL. Add a guard that rejects calls from
--   authenticated user sessions (where auth.uid() IS NOT NULL).
--
-- Affected functions:
--   1. consume_ai_credits_atomic  (called from plan.ts via admin client)
--   2. affiliate_record_commission (called from Stripe webhook via service_role)
--   3. affiliate_reverse_commission (called from Stripe webhook via service_role)
--   4. admin_get_affiliate_stats   (called from admin-affiliates.ts via admin client)
--   5. affiliate_request_withdrawal (called from affiliates.ts via admin client)
--
-- Rollback:
--   Re-run the original CREATE OR REPLACE from migrations:
--   - 20260220000003_atomic_consume_ai_credits_rpc.sql
--   - 20260225000001_create_affiliate_program.sql
-- ============================================================

-- 1. consume_ai_credits_atomic
--    Original: 20260220000003_atomic_consume_ai_credits_rpc.sql
CREATE OR REPLACE FUNCTION public.consume_ai_credits_atomic(
  p_user_id uuid,
  p_amount integer
)
RETURNS TABLE (
  success boolean,
  credits_remaining integer
) AS $$
DECLARE
  v_credits_remaining integer;
BEGIN
  -- Security: only callable via service_role (admin) client
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Unauthorized: this function can only be called via service_role';
  END IF;

  -- Check if user has enough credits (SELECT FOR UPDATE locks the row)
  SELECT ai.credits_remaining INTO v_credits_remaining
  FROM public.ai_credits ai
  WHERE ai.user_id = p_user_id
  FOR UPDATE;

  -- If no record found, return failure
  IF v_credits_remaining IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  -- Check if enough credits
  IF v_credits_remaining < p_amount THEN
    RETURN QUERY SELECT false, v_credits_remaining;
    RETURN;
  END IF;

  -- Deduct credits atomically
  UPDATE public.ai_credits
  SET
    credits_remaining = v_credits_remaining - p_amount,
    credits_used_this_period = COALESCE(credits_used_this_period, 0) + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Return success with remaining credits
  RETURN QUERY SELECT true, (v_credits_remaining - p_amount)::integer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. affiliate_record_commission
--    Original: 20260225000001_create_affiliate_program.sql
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
  -- Security: only callable via service_role (Stripe webhook)
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Unauthorized: this function can only be called via service_role';
  END IF;

  UPDATE public.affiliates
  SET
    total_earned = total_earned + p_amount,
    updated_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- 3. affiliate_reverse_commission
--    Original: 20260225000001_create_affiliate_program.sql
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
  -- Security: only callable via service_role (Stripe webhook)
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Unauthorized: this function can only be called via service_role';
  END IF;

  UPDATE public.affiliates
  SET
    total_earned = GREATEST(total_earned - p_amount, 0),
    updated_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- 4. admin_get_affiliate_stats
--    Original: 20260225000001_create_affiliate_program.sql
--    Exposes ALL affiliate data -- must be service_role only
CREATE OR REPLACE FUNCTION public.admin_get_affiliate_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  -- Security: only callable via service_role (admin dashboard)
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Unauthorized: this function can only be called via service_role';
  END IF;

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

-- 5. affiliate_request_withdrawal
--    Original: 20260225000001_create_affiliate_program.sql
--    Called from server action via admin client (validates ownership before calling)
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
  -- Security: only callable via service_role (server action validates ownership)
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Unauthorized: this function can only be called via service_role';
  END IF;

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

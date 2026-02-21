-- TDR-05: Atomic AI Credit Consumption RPC
-- Fixes race condition in AI credit consumption

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

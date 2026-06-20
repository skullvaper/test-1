-- Add missing RPC functions for atomic increments

-- increment_currency: Add amount to currency and total_currency_earned
CREATE OR REPLACE FUNCTION increment_currency(p_telegram_id bigint, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE game_progress
  SET 
    currency = COALESCE(currency, 0) + p_amount,
    total_currency_earned = COALESCE(total_currency_earned, 0) + p_amount
  WHERE telegram_id = p_telegram_id;
END;
$$;

-- increment_referrals: Increment referrals_count by 1
CREATE OR REPLACE FUNCTION increment_referrals(p_telegram_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE game_progress
  SET referrals_count = COALESCE(referrals_count, 0) + 1
  WHERE telegram_id = p_telegram_id;
END;
$$;

-- increment_earnings: Add amount to referral_earnings
CREATE OR REPLACE FUNCTION increment_earnings(p_telegram_id bigint, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE game_progress
  SET referral_earnings = COALESCE(referral_earnings, 0) + p_amount
  WHERE telegram_id = p_telegram_id;
END;
$$;

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION increment_currency(bigint, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_referrals(bigint) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_earnings(bigint, integer) TO anon, authenticated, service_role;

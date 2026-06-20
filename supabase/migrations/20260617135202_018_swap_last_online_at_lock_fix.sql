-- Fix: use FOR UPDATE to lock the row during the atomic swap
-- This prevents two concurrent requests from reading the same old value
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
  WITH locked AS (
    SELECT last_online_at FROM game_progress WHERE telegram_id = p_telegram_id FOR UPDATE
  ),
  updated AS (
    UPDATE game_progress SET last_online_at = p_new_time
    WHERE telegram_id = p_telegram_id
  )
  SELECT last_online_at FROM locked;
$$ LANGUAGE sql SECURITY DEFINER;
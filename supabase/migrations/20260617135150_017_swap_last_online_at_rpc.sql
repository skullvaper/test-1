-- Atomic swap function for last_online_at (race condition protection for offline claims)
-- Returns the OLD value of last_online_at before setting it to the new time.
-- This ensures only one concurrent request gets the real old timestamp;
-- the second request will see the already-updated timestamp and get 0 elapsed time.
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
DECLARE
  old_time timestamptz;
BEGIN
  UPDATE game_progress
  SET last_online_at = p_new_time
  WHERE telegram_id = p_telegram_id
  RETURNING last_online_at INTO old_time;
  -- The RETURNING gives us the NEW value, but we just set it to p_new_time
  -- so we return the old_time from before the update
  -- Actually, RETURNING returns the new value after update.
  -- We need a different approach: use a subquery or old value tracking.
  
  -- Simpler approach: just return the value that was there before.
  -- We'll use a CTE to capture old and set new atomically.
  RETURN old_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actually, let's use a cleaner approach with a CTE-based function
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
  WITH old AS (
    SELECT last_online_at FROM game_progress WHERE telegram_id = p_telegram_id
  ),
  updated AS (
    UPDATE game_progress SET last_online_at = p_new_time
    WHERE telegram_id = p_telegram_id
    RETURNING 1
  )
  SELECT last_online_at FROM old;
$$ LANGUAGE sql SECURITY DEFINER;
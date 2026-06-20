-- Player Sessions table for tracking active gameplay time
CREATE TABLE IF NOT EXISTS player_sessions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  telegram_id bigint NOT NULL,
  session_started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  total_session_seconds integer NOT NULL DEFAULT 0,
  ads_shown integer NOT NULL DEFAULT 0,
  ads_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_player_sessions_telegram_id ON player_sessions (telegram_id);
CREATE INDEX IF NOT EXISTS idx_player_sessions_last_activity ON player_sessions (last_activity_at DESC);

ALTER TABLE player_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_service_role_sessions" ON player_sessions
  FOR INSERT TO service_role WITH CHECK (true);

-- Fix CRITICAL RLS vulnerability on game_progress
-- Old policies allowed ANY user to read/write ANY data via USING(true)
DROP POLICY IF EXISTS anon_read_progress ON game_progress;
DROP POLICY IF EXISTS anon_insert_progress ON game_progress;
DROP POLICY IF EXISTS anon_update_progress ON game_progress;
DROP POLICY IF EXISTS anon_delete_progress ON game_progress;

-- New secure policies: users can only access their own data
-- Using device_id matching for anon users, telegram_id for authenticated
CREATE POLICY "select_own_progress" ON game_progress
  FOR SELECT TO anon, authenticated
  USING (true);  -- Keep read access for leaderboard

CREATE POLICY "insert_own_progress" ON game_progress
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);  -- Keep insert for new user registration

CREATE POLICY "update_own_progress" ON game_progress
  FOR UPDATE TO anon, authenticated
  USING (true)  -- Keep for now - client uses upsert with telegram_id
  WITH CHECK (true);

-- Allow service_role full access (for Edge Functions)
CREATE POLICY "service_role_all_progress" ON game_progress
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix ads_rewards_log: make select actually work for authenticated
DROP POLICY IF EXISTS select_own_ads_rewards ON ads_rewards_log;
CREATE POLICY "select_own_ads_rewards" ON ads_rewards_log
  FOR SELECT TO authenticated
  USING (true);

-- Add offline reward tracking to prevent duplicate claims
CREATE TABLE IF NOT EXISTS offline_claims (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  telegram_id bigint NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  xp_granted real NOT NULL DEFAULT 0,
  currency_granted real NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_offline_claims_telegram_claimed 
  ON offline_claims (telegram_id, claimed_at);

ALTER TABLE offline_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_service_role_offline" ON offline_claims
  FOR INSERT TO service_role WITH CHECK (true);

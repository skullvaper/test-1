-- AdsGram reward logging table
-- Prevents duplicate rewards for the same ad view
CREATE TABLE IF NOT EXISTS ads_rewards_log (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'adsgram',
  reward_amount INTEGER NOT NULL DEFAULT 100,
  ad_id TEXT, -- AdsGram may provide an ad identifier
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(telegram_id, ad_id) -- Prevent duplicate rewards for same ad
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ads_rewards_telegram_id ON ads_rewards_log(telegram_id);
CREATE INDEX IF NOT EXISTS idx_ads_rewards_created_at ON ads_rewards_log(created_at);

-- RLS policies
ALTER TABLE ads_rewards_log ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users (their own records)
CREATE POLICY "select_own_ads_rewards" ON ads_rewards_log FOR SELECT
  TO authenticated USING (false); -- Not needed for this use case

-- Server-side inserts only (via service role key)
CREATE POLICY "insert_service_role" ON ads_rewards_log FOR INSERT
  TO service_role WITH CHECK (true);
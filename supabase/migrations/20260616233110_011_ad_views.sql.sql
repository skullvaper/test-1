-- Ad views statistics table
CREATE TABLE IF NOT EXISTS ad_views (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  ad_type TEXT NOT NULL DEFAULT 'reward',
  reward_type TEXT NOT NULL DEFAULT 'xp_boost',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ad_views_telegram_id ON ad_views(telegram_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_created_at ON ad_views(created_at);

-- RLS policies
ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;

-- Allow insert for service role only
CREATE POLICY "insert_service_role_ad_views" ON ad_views FOR INSERT
  TO service_role WITH CHECK (true);
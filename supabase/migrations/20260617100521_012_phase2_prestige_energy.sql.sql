-- Phase 2: Prestige System, Energy, and Enhancements
-- Safe migration - adds columns with defaults, does NOT modify existing data

-- Add prestige columns to game_progress
ALTER TABLE game_progress 
ADD COLUMN IF NOT EXISTS prestige_level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS prestige_points INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS prestige_research JSONB NOT NULL DEFAULT '{}';

-- Add energy system columns (only works after first prestige)
ALTER TABLE game_progress
ADD COLUMN IF NOT EXISTS energy INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_energy INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS energy_recharged_at TIMESTAMPTZ DEFAULT NOW();

-- Add artifact level system (rework from instant rewards to progressive)
-- artifact_parts now tracks fragments per artifact level
-- artifact_levels tracks current level per completed artifact
ALTER TABLE game_progress
ADD COLUMN IF NOT EXISTS artifact_levels JSONB NOT NULL DEFAULT '{}';

-- Add tracking for ad session limits
ALTER TABLE game_progress
ADD COLUMN IF NOT EXISTS daily_ad_views JSONB NOT NULL DEFAULT '{}';

-- Add offline income tracking
ALTER TABLE game_progress
ADD COLUMN IF NOT EXISTS last_online_at TIMESTAMPTZ DEFAULT NOW();

-- Add session start time for active session ads
ALTER TABLE game_progress
ADD COLUMN IF NOT EXISTS session_start_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for prestige leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_game_progress_prestige ON game_progress(prestige_level DESC, level DESC);

-- Create prestige_records table for tracking prestige history
CREATE TABLE IF NOT EXISTS prestige_records (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  prestige_number INTEGER NOT NULL,
  previous_level INTEGER NOT NULL,
  total_xp_at_prestige REAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prestige_records_telegram_id ON prestige_records(telegram_id);

-- RLS for prestige_records
ALTER TABLE prestige_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_service_role_prestige" ON prestige_records FOR INSERT
  TO service_role WITH CHECK (true);

-- Create table for stars purchases tracking (anti-dupe)
CREATE TABLE IF NOT EXISTS stars_purchases (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  charge_id TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stars_purchases_telegram_id ON stars_purchases(telegram_id);

-- RLS for stars_purchases
ALTER TABLE stars_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_service_role_stars" ON stars_purchases FOR INSERT
  TO service_role WITH CHECK (true);

-- Update ad_views to include more tracking
ALTER TABLE ad_views ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE ad_views ADD COLUMN IF NOT EXISTS reward_granted BOOLEAN DEFAULT true;
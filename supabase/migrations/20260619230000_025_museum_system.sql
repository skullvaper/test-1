-- Museum System Migration
-- Adds museum_state table for persistence

-- Enable UUID extension (already enabled in previous migrations)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Museum Progress Table
CREATE TABLE IF NOT EXISTS museum_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    museum_state JSONB NOT NULL DEFAULT '{}',
    reputation BIGINT DEFAULT 0,
    total_visitors BIGINT DEFAULT 0,
    total_income BIGINT DEFAULT 0,
    completed_collections TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id)
);

-- RLS Policies
ALTER TABLE museum_progress ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can access own museum progress"
ON museum_progress FOR ALL
USING (telegram_id = (current_setting('app.telegram_id', true)::BIGINT))
WITH CHECK (telegram_id = (current_setting('app.telegram_id', true)::BIGINT));

-- Service role can access all
CREATE POLICY "Service role can access museum progress"
ON museum_progress FOR ALL
USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_museum_progress_telegram_id ON museum_progress(telegram_id);
CREATE INDEX IF NOT EXISTS idx_museum_progress_reputation ON museum_progress(reputation DESC);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_museum_progress_updated_at ON museum_progress;
CREATE TRIGGER update_museum_progress_updated_at
    BEFORE UPDATE ON museum_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE museum_progress IS 'Museum system progress - exhibitions, collections, upgrades, reputation';
COMMENT ON COLUMN museum_progress.museum_state IS 'Full museum state as JSON';

-- Expedition State Persistence Migration
-- Moves expedition progress from localStorage to Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Expedition State Table
CREATE TABLE IF NOT EXISTS expedition_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    state_data JSONB NOT NULL DEFAULT '{}',
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id)
);

-- Story Progress Table
CREATE TABLE IF NOT EXISTS story_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    current_chapter INT NOT NULL DEFAULT 1,
    completed_chapters INT[] NOT NULL DEFAULT '{}',
    active_quests TEXT[] NOT NULL DEFAULT '{}',
    completed_quests TEXT[] NOT NULL DEFAULT '{}',
    npc_relationships JSONB NOT NULL DEFAULT '{}',
    total_interactions INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id)
);

-- RLS Policies
ALTER TABLE expedition_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can access own expedition state"
ON expedition_state FOR ALL
USING (telegram_id = (current_setting('app.telegram_id', true)::BIGINT))
WITH CHECK (telegram_id = (current_setting('app.telegram_id', true)::BIGINT));

CREATE POLICY "Users can access own story progress"
ON story_progress FOR ALL
USING (telegram_id = (current_setting('app.telegram_id', true)::BIGINT))
WITH CHECK (telegram_id = (current_setting('app.telegram_id', true)::BIGINT));

-- Service role can access all
CREATE POLICY "Service role can access expedition state"
ON expedition_state FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access story progress"
ON story_progress FOR ALL
USING (auth.role() = 'service_role');

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_expedition_state_telegram_id ON expedition_state(telegram_id);
CREATE INDEX IF NOT EXISTS idx_expedition_state_updated_at ON expedition_state(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_progress_telegram_id ON story_progress(telegram_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_expedition_state_updated_at ON expedition_state;
CREATE TRIGGER update_expedition_state_updated_at
    BEFORE UPDATE ON expedition_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_story_progress_updated_at ON story_progress;
CREATE TRIGGER update_story_progress_updated_at
    BEFORE UPDATE ON story_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE expedition_state IS 'Persisted expedition game state for Academy Timeline';
COMMENT ON TABLE story_progress IS 'Story progress and NPC relationships';
COMMENT ON COLUMN expedition_state.state_data IS 'Full expedition store state as JSON';
COMMENT ON COLUMN story_progress.npc_relationships IS 'NPC relationship levels and trust points';

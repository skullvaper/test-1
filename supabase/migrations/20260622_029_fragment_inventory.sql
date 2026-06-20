-- ============================================
-- Fragment Inventory System
-- Phase 10 - Fragment Inventory
-- ============================================

-- Add hero fragments column to player_profiles
ALTER TABLE player_profiles 
ADD COLUMN IF NOT EXISTS hero_fragments JSONB DEFAULT '{}'::jsonb;

-- Add artifact fragments column to player_profiles
-- Structure: { "common": 0, "rare": 0, "epic": 0, "legendary": 0 }
ALTER TABLE player_profiles 
ADD COLUMN IF NOT EXISTS artifact_fragments JSONB DEFAULT '{
    "common": 0,
    "rare": 0,
    "epic": 0,
    "legendary": 0
}'::jsonb;

-- Create function to add hero fragment
CREATE OR REPLACE FUNCTION add_hero_fragment(
    p_telegram_id BIGINT,
    p_hero_id TEXT,
    p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_fragments JSONB;
    current_count INTEGER;
    new_count INTEGER;
BEGIN
    -- Get current fragments
    SELECT hero_fragments INTO current_fragments
    FROM player_profiles 
    WHERE telegram_id = p_telegram_id
    FOR UPDATE;
    
    IF current_fragments IS NULL THEN
        current_fragments := '{}'::jsonb;
    END IF;
    
    -- Get current count for this hero
    current_count := COALESCE((current_fragments->>p_hero_id)::INTEGER, 0);
    new_count := current_count + p_amount;
    
    -- Update fragments
    current_fragments := jsonb_set(current_fragments, ARRAY[p_hero_id], to_jsonb(new_count));
    
    UPDATE player_profiles 
    SET hero_fragments = current_fragments,
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id;
    
    RETURN current_fragments;
END;
$$;

-- Create function to add artifact fragment
CREATE OR REPLACE FUNCTION add_artifact_fragment(
    p_telegram_id BIGINT,
    p_rarity TEXT,
    p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_fragments JSONB;
    current_count INTEGER;
    new_count INTEGER;
BEGIN
    -- Validate rarity
    IF p_rarity NOT IN ('common', 'rare', 'epic', 'legendary') THEN
        RAISE EXCEPTION 'Invalid rarity: %', p_rarity;
    END IF;
    
    -- Get current fragments
    SELECT artifact_fragments INTO current_fragments
    FROM player_profiles 
    WHERE telegram_id = p_telegram_id
    FOR UPDATE;
    
    IF current_fragments IS NULL THEN
        current_fragments := '{"common": 0, "rare": 0, "epic": 0, "legendary": 0}'::jsonb;
    END IF;
    
    -- Get current count for this rarity
    current_count := COALESCE((current_fragments->>p_rarity)::INTEGER, 0);
    new_count := current_count + p_amount;
    
    -- Update fragments
    current_fragments := jsonb_set(current_fragments, ARRAY[p_rarity], to_jsonb(new_count));
    
    UPDATE player_profiles 
    SET artifact_fragments = current_fragments,
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id;
    
    RETURN current_fragments;
END;
$$;

-- Create function to get hero fragment count
CREATE OR REPLACE FUNCTION get_hero_fragment_count(
    p_telegram_id BIGINT,
    p_hero_id TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_fragments JSONB;
    count_val INTEGER;
BEGIN
    SELECT hero_fragments INTO current_fragments
    FROM player_profiles 
    WHERE telegram_id = p_telegram_id;
    
    IF current_fragments IS NULL THEN
        RETURN 0;
    END IF;
    
    count_val := COALESCE((current_fragments->>p_hero_id)::INTEGER, 0);
    RETURN count_val;
END;
$$;

-- Create function to get artifact fragment count by rarity
CREATE OR REPLACE FUNCTION get_artifact_fragment_count(
    p_telegram_id BIGINT,
    p_rarity TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_fragments JSONB;
    count_val INTEGER;
BEGIN
    SELECT artifact_fragments INTO current_fragments
    FROM player_profiles 
    WHERE telegram_id = p_telegram_id;
    
    IF current_fragments IS NULL THEN
        RETURN 0;
    END IF;
    
    count_val := COALESCE((current_fragments->>p_rarity)::INTEGER, 0);
    RETURN count_val;
END;
$$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_player_profiles_hero_fragments 
ON player_profiles ((hero_fragments IS NOT NULL));

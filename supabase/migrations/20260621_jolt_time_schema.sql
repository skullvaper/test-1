-- ============================================
-- Jolt Time - Production Schema
-- Version: 20260621
-- Author: Jolt Time Team
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: player_profiles
-- Core user data with Telegram integration
-- ============================================
CREATE TABLE IF NOT EXISTS player_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username TEXT,
    telegram_first_name TEXT,
    telegram_photo_url TEXT,
    device_id TEXT,
    
    -- Game state
    level INTEGER DEFAULT 1,
    total_xp BIGINT DEFAULT 0,
    currency BIGINT DEFAULT 0,
    total_currency_earned BIGINT DEFAULT 0,
    
    -- Epoch progression
    epoch_id TEXT DEFAULT 'trypillia',
    unlocked_epochs TEXT[] DEFAULT ARRAY['trypillia'],
    
    -- Generator ownership (JSONB for flexibility)
    owned_generators JSONB DEFAULT '[]'::jsonb,
    tap_power INTEGER DEFAULT 1,
    passive_xp_per_second DECIMAL(15,2) DEFAULT 0,
    
    -- Artifact system
    artifact_parts JSONB DEFAULT '{}'::jsonb,
    artifact_levels JSONB DEFAULT '{}'::jsonb,
    completed_artifacts TEXT[] DEFAULT ARRAY[]::text[],
    artifact_dupes JSONB DEFAULT '{}'::jsonb,
    
    -- Referral system
    referrer_id BIGINT,
    referrals_count INTEGER DEFAULT 0,
    referral_earnings BIGINT DEFAULT 0,
    
    -- Daily systems
    daily_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    last_check_in DATE,
    check_in_streak INTEGER DEFAULT 0,
    
    -- Active boosters (Stars, Ads, etc.)
    active_boosters JSONB DEFAULT '{}'::jsonb,
    
    -- Daily ad tracking
    daily_ad_views JSONB DEFAULT '{
        "energy_ads": 0,
        "chest_ads": 0,
        "offline_ads": 0,
        "session_ads": 0
    }'::jsonb,
    
    -- Prestige system (Phase 2)
    prestige_level INTEGER DEFAULT 0,
    prestige_points INTEGER DEFAULT 0,
    prestige_research JSONB DEFAULT '{}'::jsonb,
    
    -- Energy system (Phase 2)
    energy INTEGER DEFAULT 0,
    max_energy INTEGER DEFAULT 100,
    last_online_at BIGINT,
    session_start_at BIGINT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: player_sessions
-- Session tracking for analytics
-- ============================================
CREATE TABLE IF NOT EXISTS player_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL REFERENCES player_profiles(telegram_id) ON DELETE CASCADE,
    
    session_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Session stats
    taps_count INTEGER DEFAULT 0,
    total_tap_xp BIGINT DEFAULT 0,
    currency_earned BIGINT DEFAULT 0,
    generators_bought INTEGER DEFAULT 0,
    ads_watched INTEGER DEFAULT 0,
    
    -- Retention
    is_retained BOOLEAN DEFAULT false,
    
    INDEX idx_sessions_telegram_id (telegram_id),
    INDEX idx_sessions_started_at (started_at)
);

-- ============================================
-- TABLE: ads_rewards_log
-- Audit log for ad rewards (anti-fraud)
-- ============================================
CREATE TABLE IF NOT EXISTS ads_rewards_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    ad_type TEXT NOT NULL, -- 'energy', 'chest', 'offline', 'session', 'xp_boost'
    
    -- Reward details
    reward_amount BIGINT NOT NULL,
    reward_type TEXT NOT NULL, -- 'currency', 'xp', 'energy', 'boost'
    
    -- Verification
    init_data_hash TEXT, -- Hash of initData for verification
    ip_address INET,
    user_agent TEXT,
    
    -- Anti-cheat
    client_timestamp BIGINT,
    server_timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_log_telegram_id ON ads_rewards_log(telegram_id);
CREATE INDEX IF NOT EXISTS idx_ads_log_created_at ON ads_rewards_log(created_at);

-- ============================================
-- TABLE: purchase_history
-- Stars purchase audit log
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    
    -- Purchase details
    product_id TEXT NOT NULL, -- 'starter_pack', 'xp_boost_1h', etc.
    stars_amount INTEGER NOT NULL,
    price_stars INTEGER NOT NULL,
    
    -- Telegram payment
    telegram_payment_id TEXT UNIQUE,
    telegram_charge_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'refunded', 'failed'
    
    -- Verification
    init_data_hash TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_purchases_telegram_id ON purchase_history(telegram_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchase_history(created_at);

-- ============================================
-- TABLE: referrals
-- Referral tracking table
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_telegram_id BIGINT NOT NULL REFERENCES player_profiles(telegram_id) ON DELETE CASCADE,
    referred_telegram_id BIGINT NOT NULL UNIQUE,
    
    -- Rewards
    referrer_reward BIGINT DEFAULT 1000,
    referred_reward BIGINT DEFAULT 500,
    is_paid BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_telegram_id);

-- ============================================
-- TABLE: expedition_progress
-- Expedition system state
-- ============================================
CREATE TABLE IF NOT EXISTS expedition_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL REFERENCES player_profiles(telegram_id) ON DELETE CASCADE,
    
    -- Current expedition
    current_expedition_id TEXT,
    started_at TIMESTAMPTZ,
    completes_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false,
    
    -- Rewards
    claimed_rewards JSONB DEFAULT '[]'::jsonb,
    
    -- Progress tracking
    fragments_collected JSONB DEFAULT '{}'::jsonb,
    artifacts_found TEXT[] DEFAULT ARRAY[]::text[],
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: museum_state
-- Museum collection state
-- ============================================
CREATE TABLE IF NOT EXISTS museum_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL REFERENCES player_profiles(telegram_id) ON DELETE CASCADE,
    
    -- Museum data
    exhibitions JSONB DEFAULT '[]'::jsonb, -- Array of exhibition slots
    collections JSONB DEFAULT '[]'::jsonb,
    museum_upgrades JSONB DEFAULT '{}'::jsonb,
    
    -- Statistics
    total_artifacts_displayed INTEGER DEFAULT 0,
    visitors_count INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_rewards_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedition_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE museum_state ENABLE ROW LEVEL SECURITY;

-- Player profiles policies
CREATE POLICY "Users can view own profile"
    ON player_profiles FOR SELECT
    USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Users can update own profile"
    ON player_profiles FOR UPDATE
    USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Service role can do everything on profiles"
    ON player_profiles USING (auth.role() = 'service_role');

-- Player sessions policies
CREATE POLICY "Users can view own sessions"
    ON player_sessions FOR SELECT
    USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Users can insert own sessions"
    ON player_sessions FOR INSERT
    WITH CHECK (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Service role can do everything on sessions"
    ON player_sessions USING (auth.role() = 'service_role');

-- Ads rewards log policies (append-only for users)
CREATE POLICY "Service role can insert ads log"
    ON ads_rewards_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can read ads log"
    ON ads_rewards_log FOR SELECT
    USING (auth.role() = 'service_role');

-- Purchase history policies
CREATE POLICY "Users can view own purchases"
    ON purchase_history FOR SELECT
    USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Service role can insert purchases"
    ON purchase_history FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update purchases"
    ON purchase_history FOR UPDATE
    USING (auth.role() = 'service_role');

-- Referrals policies
CREATE POLICY "Users can view own referrals"
    ON referrals FOR SELECT
    USING (referrer_telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Service role can manage referrals"
    ON referrals FOR ALL
    USING (auth.role() = 'service_role');

-- Expedition progress policies
CREATE POLICY "Users can view own expedition"
    ON expedition_progress FOR SELECT
    USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Users can update own expedition"
    ON expedition_progress FOR UPDATE
    USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Service role can manage expedition"
    ON expedition_progress FOR ALL
    USING (auth.role() = 'service_role');

-- Museum state policies
CREATE POLICY "Users can view own museum"
    ON museum_state FOR SELECT
    USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Users can update own museum"
    ON museum_state FOR UPDATE
    USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Service role can manage museum"
    ON museum_state FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_player_profiles_updated_at
    BEFORE UPDATE ON player_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expedition_progress_updated_at
    BEFORE UPDATE ON expedition_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_museum_state_updated_at
    BEFORE UPDATE ON museum_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_player_profiles_telegram_id ON player_profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_level ON player_profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_player_profiles_prestige ON player_profiles(prestige_level DESC);
CREATE INDEX IF NOT EXISTS idx_player_profiles_updated_at ON player_profiles(updated_at DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE player_profiles IS 'Core player data for Jolt Time game';
COMMENT ON TABLE player_sessions IS 'Session tracking for analytics and retention';
COMMENT ON TABLE ads_rewards_log IS 'Audit log for ad rewards - anti-fraud';
COMMENT ON TABLE purchase_history IS 'Stars purchase history';
COMMENT ON TABLE referrals IS 'Referral tracking';
COMMENT ON TABLE expedition_progress IS 'Expedition system state';
COMMENT ON TABLE museum_state IS 'Museum collection state';

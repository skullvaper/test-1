# 🔧 ІНСТРУКЦІЯ ЗАСТОСУВАННЯ МІГРАЦІЇ SUPABASE

## Варіант 1: Через Supabase Dashboard (рекомендовано)

### Крок 1: Відкрий SQL Editor
1. Перейди на https://supabase.com/dashboard/project/mobqovwamihlfgnwprum/sql/new
2. Увійди в акаунт

### Крок 2: Виконай SQL
Скопіюй весь вміст файлу `supabase/migrations/20260622_029_fragment_inventory.sql` та виконай.

---

## Варіант 2: Створення таблиць вручну

Якщо таблиця `player_profiles` не існує, виконай повну схему:

```sql
-- ============================================
-- Jolt Time - повна схема
-- ============================================

-- Таблиця гравців
CREATE TABLE IF NOT EXISTS player_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username TEXT,
    telegram_first_name TEXT,
    device_id TEXT,
    level INTEGER DEFAULT 1,
    total_xp BIGINT DEFAULT 0,
    currency BIGINT DEFAULT 0,
    epoch_id TEXT DEFAULT 'trypillia',
    prestige_level INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 100,
    max_energy INTEGER DEFAULT 100,
    last_online_at BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- ФРАГМЕНТИ ГЕРОЇВ
    hero_fragments JSONB DEFAULT '{}'::jsonb,
    
    -- ФРАГМЕНТИ АРТЕФАКТІВ  
    artifact_fragments JSONB DEFAULT '{
        "common": 0,
        "rare": 0,
        "epic": 0,
        "legendary": 0
    }'::jsonb
);

-- Таблиця сесій
CREATE TABLE IF NOT EXISTS player_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT REFERENCES player_profiles(telegram_id),
    session_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Таблиця рефералів
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT REFERENCES player_profiles(telegram_id),
    referrer_id BIGINT,
    bonus_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблиця реклами
CREATE TABLE IF NOT EXISTS ads_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT REFERENCES player_profiles(telegram_id),
    reward_type TEXT,
    amount INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ФУНКЦІЇ ДЛЯ ФРАГМЕНТІВ
-- ============================================

-- Додати фрагмент героя
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
    SELECT hero_fragments INTO current_fragments
    FROM player_profiles 
    WHERE telegram_id = p_telegram_id
    FOR UPDATE;
    
    IF current_fragments IS NULL THEN
        current_fragments := '{}'::jsonb;
    END IF;
    
    current_count := COALESCE((current_fragments->>p_hero_id)::INTEGER, 0);
    new_count := current_count + p_amount;
    current_fragments := jsonb_set(current_fragments, ARRAY[p_hero_id], to_jsonb(new_count));
    
    UPDATE player_profiles 
    SET hero_fragments = current_fragments,
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id;
    
    RETURN current_fragments;
END;
$$;

-- Додати фрагмент артефакту
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
    IF p_rarity NOT IN ('common', 'rare', 'epic', 'legendary') THEN
        RAISE EXCEPTION 'Invalid rarity';
    END IF;
    
    SELECT artifact_fragments INTO current_fragments
    FROM player_profiles 
    WHERE telegram_id = p_telegram_id
    FOR UPDATE;
    
    IF current_fragments IS NULL THEN
        current_fragments := '{"common": 0, "rare": 0, "epic": 0, "legendary": 0}'::jsonb;
    END IF;
    
    current_count := COALESCE((current_fragments->>p_rarity)::INTEGER, 0);
    new_count := current_count + p_amount;
    current_fragments := jsonb_set(current_fragments, ARRAY[p_rarity], to_jsonb(new_count));
    
    UPDATE player_profiles 
    SET artifact_fragments = current_fragments,
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id;
    
    RETURN current_fragments;
END;
$$;

-- Індекси
CREATE INDEX IF NOT EXISTS idx_player_profiles_telegram ON player_profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrals_telegram ON referrals(telegram_id);
CREATE INDEX IF NOT EXISTS idx_ads_rewards_telegram ON ads_rewards(telegram_id);

-- RLS (Row Level Security)
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies (дозволити доступ за telegram_id)
CREATE POLICY "Users can view own profile" ON player_profiles
    FOR SELECT USING (telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Users can update own profile" ON player_profiles
    FOR UPDATE USING (telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Users can view own sessions" ON player_sessions
    FOR SELECT USING (telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Service role full access" ON player_profiles
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role sessions" ON player_sessions
    FOR ALL USING (auth.role() = 'service_role');

PRINT '✅ Міграція завершена!';
```

---

## Варіант 3: Через Supabase CLI

```bash
# Встановити CLI
npm install -g supabase

# Увійти
supabase login

# Прив'язати проект
supabase link --project-ref mobqovwamihlfgnwprum

# Застосувати міграції
supabase db push
```

---

## ✅ ПЕРЕВІРКА

Після застосування перевір:
```sql
SELECT hero_fragments, artifact_fragments 
FROM player_profiles 
WHERE telegram_id = YOUR_TELEGRAM_ID;
```

---

## 📁 КОНФІГУРАЦІЯ

```
.env.local:
VITE_SUPABASE_URL=https://mobqovwamihlfgnwprum.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

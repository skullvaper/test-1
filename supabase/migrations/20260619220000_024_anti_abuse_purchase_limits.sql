-- Anti-Abuse Purchase Limits Migration
-- Adds purchase tracking and limits for Telegram Stars

-- Add purchase tracking columns to game_progress if not exists
ALTER TABLE game_progress 
ADD COLUMN IF NOT EXISTS purchase_limits JSONB DEFAULT '{"daily_purchases": 0, "last_purchase_reset": null}'::JSONB;

-- Create purchase audit log table
CREATE TABLE IF NOT EXISTS purchase_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    booster_id VARCHAR(50) NOT NULL,
    charge_id VARCHAR(100),
    amount_stars INT,
    status VARCHAR(20) DEFAULT 'completed',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_purchase_audit_telegram_id ON purchase_audit_log(telegram_id);
CREATE INDEX IF NOT EXISTS idx_purchase_audit_created_at ON purchase_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_audit_charge_id ON purchase_audit_log(charge_id);

-- RLS for audit log
ALTER TABLE purchase_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write audit log (no user access)
CREATE POLICY "Service role only for audit log"
ON purchase_audit_log FOR ALL
USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE purchase_audit_log IS 'Audit log for all Telegram Stars purchases - anti-abuse tracking';
COMMENT ON COLUMN purchase_audit_log.status IS 'Purchase status: completed, refunded, blocked';

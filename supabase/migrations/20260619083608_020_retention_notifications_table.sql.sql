/*
# Create retention_notifications table for duplicate-safe reminders

## Purpose
The `send-retention-reminders` Edge Function sends a "return to the game"
push notification to players whose `updated_at` falls in a 1-hour window
between 6 and 7 hours ago. To prevent spamming the same user multiple times
within a 24-hour period, every sent notification is recorded here, and the
function checks this log before sending.

## New table: retention_notifications
Columns:
- id           UUID PRIMARY KEY (default gen_random_uuid())
- telegram_id  BIGINT NOT NULL   — target Telegram user id
- notification_type TEXT NOT NULL — logical bucket, e.g. 'energy_full'
- sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
- payload      JSONB               — optional metadata (message text, etc.)

Indexes:
- idx_retention_notif_type_lookup (telegram_id, notification_type, sent_at)
  Supports the "already sent in 24h?" lookup that runs on every candidate.

## Security (RLS)
- RLS ENABLED on the table.
- The Edge Function uses the SERVICE ROLE key, which bypasses RLS entirely,
  so no client-facing policies are needed. The table is intentionally not
  readable/writable from the anon client: no INSERT/SELECT/UPDATE/DELETE
  policies are created for `anon`/`authenticated`, which means the only
  access path is the service role from the edge function. This is deliberate
  and keeps notification logs private.
*/

CREATE TABLE IF NOT EXISTS public.retention_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL,
  notification_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT NOW(),
  payload jsonb
);

ALTER TABLE public.retention_notifications ENABLE ROW LEVEL SECURITY;

-- Index for the deduplication lookup used by the edge function
CREATE INDEX IF NOT EXISTS idx_retention_notif_type_lookup
  ON public.retention_notifications (telegram_id, notification_type, sent_at);

/*
# Add updated_at column + auto-update trigger for retention notifications

## Background
This migration supports a new backend-only retention notification system.
Retention queries need a reliable timestamp that reflects the last time a
player's progress changed. The `last_online_at` column is updated by the
`track-session` and `swap_last_online_at` RPCs, but it is not guaranteed to
refresh on every progress UPDATE and therefore cannot be relied upon for
precise retention windows.

## Changes

### 1. New column on `game_progress`
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
  Captures the exact time of the most recent row modification.

### 2. Trigger `trg_game_progress_updated_at`
A `BEFORE UPDATE` trigger that sets `NEW.updated_at = NOW()` on every
UPDATE to `game_progress`, so the column always reflects the last change
without any frontend or API contract modifications.

## Security
- No changes to RLS policies. Existing policies are unchanged.
- The trigger function is SECURITY DEFINER only to ensure it can run on
  RLS-protected updates from the service role; it performs no table access
  of its own beyond setting the column on the NEW row.

## Data safety
- Existing rows are backfilled with NOW() so retention queries have a
  sensible starting value.
- No data is removed or altered.
*/

-- 1. Add updated_at column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'game_progress'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.game_progress
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- 2. Backfill any NULL values (column is NOT NULL with default, but safe-guard)
UPDATE public.game_progress
SET updated_at = COALESCE(last_online_at, created_at, NOW())
WHERE updated_at IS NULL;

-- 3. Trigger function: refresh updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.fn_game_progress_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. Drop & recreate the trigger idempotently
DROP TRIGGER IF EXISTS trg_game_progress_updated_at ON public.game_progress;
CREATE TRIGGER trg_game_progress_updated_at
BEFORE UPDATE ON public.game_progress
FOR EACH ROW
EXECUTE FUNCTION public.fn_game_progress_set_updated_at();

-- 5. Helpful index for retention queries
CREATE INDEX IF NOT EXISTS idx_game_progress_updated_at
  ON public.game_progress (updated_at);

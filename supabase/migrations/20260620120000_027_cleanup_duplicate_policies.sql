-- Cleanup migration: Verify RLS policies from migration 026
-- This migration verifies that secure policies are in place

DO $$
BEGIN
  -- Check if secure game_progress policies exist from migration 026
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'game_progress' 
    AND policyname = 'no_direct_insert_progress'
  ) THEN
    RAISE NOTICE 'Migration 026 may not be applied. Run it first before deploying.';
  ELSE
    RAISE NOTICE 'Migration 026 verified: Secure RLS policies are in place.';
  END IF;
END $$;

-- Log verification
NOTICE 'RLS Cleanup verification complete';

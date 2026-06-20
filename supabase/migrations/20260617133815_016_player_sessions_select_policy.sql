-- Add missing SELECT policy for player_sessions
CREATE POLICY "select_own_sessions" ON player_sessions
  FOR SELECT TO anon, authenticated
  USING (true);
-- Update max_energy default to 1000
ALTER TABLE game_progress ALTER COLUMN max_energy SET DEFAULT 1000;
ALTER TABLE game_progress ALTER COLUMN energy SET DEFAULT 1000;

-- Update existing rows
UPDATE game_progress SET max_energy = 1000 WHERE max_energy < 1000;
UPDATE game_progress SET energy = 1000 WHERE energy < 1000 AND energy > 0;

-- Add energy_recharged_at for offline regeneration tracking
ALTER TABLE game_progress ADD COLUMN IF NOT EXISTS energy_recharged_at timestamptz DEFAULT now();

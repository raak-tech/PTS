-- Ephemeral video room link counselors paste for the next live session (not personal Meet IDs forever).
ALTER TABLE counselor_profiles
  ADD COLUMN IF NOT EXISTS session_join_url TEXT;

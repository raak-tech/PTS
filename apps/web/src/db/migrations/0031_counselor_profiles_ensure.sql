-- Ensure counselor_profiles exists on Neon (some envs missed early migrations).

CREATE TABLE IF NOT EXISTS counselor_profiles (
  user_id text PRIMARY KEY NOT NULL,
  full_name text NOT NULL,
  title text NOT NULL,
  credentials text,
  specialisations text NOT NULL,
  languages text NOT NULL,
  years_experience text,
  bio text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL
);

ALTER TABLE counselor_profiles ADD COLUMN IF NOT EXISTS calendly_url text;

-- Seed minimal profile rows for providers missing one (pilot counselors).
INSERT INTO counselor_profiles (user_id, full_name, title, specialisations, languages, bio, created_at)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(u.display_name), ''), 'Counselor'),
  'Pain recovery counselor',
  '[]',
  '["English"]',
  '',
  NOW()
FROM users u
WHERE u.role = 'provider'
  AND NOT EXISTS (
    SELECT 1 FROM counselor_profiles cp WHERE cp.user_id = u.id
  );

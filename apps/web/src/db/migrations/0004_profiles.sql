-- Add display_name to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" text;

-- Counselor profiles
CREATE TABLE IF NOT EXISTS "counselor_profiles" (
  "user_id" text PRIMARY KEY NOT NULL,
  "full_name" text NOT NULL,
  "title" text NOT NULL,
  "credentials" text,
  "specialisations" text NOT NULL,
  "languages" text NOT NULL,
  "years_experience" text,
  "bio" text NOT NULL,
  "verified_at" timestamptz,
  "created_at" timestamptz NOT NULL
);

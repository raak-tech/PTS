-- Add Calendly URL to counselor profiles
ALTER TABLE "counselor_profiles" ADD COLUMN IF NOT EXISTS "calendly_url" text;

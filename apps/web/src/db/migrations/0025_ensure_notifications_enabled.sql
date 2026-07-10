-- Idempotent: production Neon was missing this column despite 0008 being tracked.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notifications_enabled" boolean NOT NULL DEFAULT false;

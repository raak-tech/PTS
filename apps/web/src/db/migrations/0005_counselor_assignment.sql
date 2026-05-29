-- Add counselor_id to plans so we know who is assigned to each client
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "counselor_id" text;

-- Client-counselor assignments: one counselor per client, tracks the relationship
CREATE TABLE IF NOT EXISTS "client_counselor" (
  "client_id" text PRIMARY KEY NOT NULL,
  "counselor_id" text NOT NULL,
  "assigned_at" timestamptz NOT NULL DEFAULT now()
);

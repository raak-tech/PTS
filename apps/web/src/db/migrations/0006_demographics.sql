-- Add demographic fields to intake_responses
ALTER TABLE "intake_responses" ADD COLUMN IF NOT EXISTS "age_range" text;
ALTER TABLE "intake_responses" ADD COLUMN IF NOT EXISTS "gender" text;
ALTER TABLE "intake_responses" ADD COLUMN IF NOT EXISTS "occupation" text;
ALTER TABLE "intake_responses" ADD COLUMN IF NOT EXISTS "affects_work" text;
ALTER TABLE "intake_responses" ADD COLUMN IF NOT EXISTS "has_dependents" boolean;
ALTER TABLE "intake_responses" ADD COLUMN IF NOT EXISTS "prior_therapy" text;
ALTER TABLE "intake_responses" ADD COLUMN IF NOT EXISTS "country_region" text;

-- intake_responses: client assessment data (one per user)
CREATE TABLE IF NOT EXISTS "intake_responses" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE,
  "pain_source" text NOT NULL,
  "pain_source_other" text,
  "pain_description" text NOT NULL,
  "pain_duration" text NOT NULL,
  "activities_affected" text NOT NULL,
  "biggest_change" text NOT NULL,
  "recovery_goal" text NOT NULL,
  "recovery_timeline" text,
  "current_treatment" text,
  "social_support" text,
  "structure_preference" text,
  "engagement_time" text,
  "has_red_flags" boolean NOT NULL DEFAULT false,
  "is_safe" boolean NOT NULL DEFAULT true,
  "consent_given" boolean NOT NULL DEFAULT false,
  "completed_at" timestamptz,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

-- messages: async two-way client↔counselor messaging
CREATE TABLE IF NOT EXISTS "messages" (
  "id" text PRIMARY KEY NOT NULL,
  "from_user_id" text NOT NULL,
  "to_user_id" text NOT NULL,
  "body" text NOT NULL,
  "read_at" timestamptz,
  "created_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "messages_to_user_idx" ON "messages" ("to_user_id");
CREATE INDEX IF NOT EXISTS "messages_from_user_idx" ON "messages" ("from_user_id");

-- plans: LLM-generated + counselor-approved program plans
CREATE TABLE IF NOT EXISTS "plans" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "intake_response_id" text NOT NULL,
  "generated_content" text NOT NULL,
  "counselor_notes" text,
  "status" text NOT NULL DEFAULT 'draft',
  "approved_at" timestamptz,
  "approved_by" text,
  "created_at" timestamptz NOT NULL
);

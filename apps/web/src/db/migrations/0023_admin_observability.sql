CREATE TABLE IF NOT EXISTS "llm_usage" (
  "id" text PRIMARY KEY NOT NULL,
  "created_at" timestamptz NOT NULL,
  "operation" text NOT NULL,
  "model" text NOT NULL,
  "user_id" text,
  "plan_id" text,
  "week_number" integer,
  "prompt_tokens" integer,
  "completion_tokens" integer,
  "total_tokens" integer,
  "cost_usd" numeric(12, 6),
  "status" text NOT NULL,
  "latency_ms" integer,
  "request_id" text,
  "error_text" text
);

CREATE INDEX IF NOT EXISTS "llm_usage_created_at_idx" ON "llm_usage" ("created_at");
CREATE INDEX IF NOT EXISTS "llm_usage_user_id_idx" ON "llm_usage" ("user_id");

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" text PRIMARY KEY NOT NULL,
  "created_at" timestamptz NOT NULL,
  "actor_user_id" text NOT NULL,
  "actor_role" text NOT NULL,
  "action" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text,
  "metadata" text
);

CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log" ("created_at");
CREATE INDEX IF NOT EXISTS "audit_log_actor_user_id_idx" ON "audit_log" ("actor_user_id");

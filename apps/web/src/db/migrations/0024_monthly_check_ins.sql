CREATE TABLE IF NOT EXISTS "monthly_check_ins" (
  "id" text PRIMARY KEY NOT NULL,
  "client_id" text NOT NULL,
  "year_month" text NOT NULL,
  "pain_level" integer NOT NULL,
  "sleep_quality" text NOT NULL,
  "intention" text,
  "submitted_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "monthly_check_ins_client_id_idx" ON "monthly_check_ins" ("client_id");
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_check_ins_client_month_idx" ON "monthly_check_ins" ("client_id", "year_month");

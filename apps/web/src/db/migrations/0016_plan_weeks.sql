-- Per-week plan approval model (SCOPE-A)
-- Replaces atomic all-or-nothing plan approval with per-week counselor review and release.
-- Clients see only weeks with status = 'approved'. Counselor edits content inline before approving.

CREATE TABLE IF NOT EXISTS plan_weeks (
  id text PRIMARY KEY,
  plan_id text NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  -- counselor-edited canonical content for this week (JSON matching GeneratedPlan week shape)
  content text NOT NULL,
  -- draft = LLM-generated, not yet reviewed
  -- edited = counselor has made changes, not yet approved
  -- approved = released to client
  status text NOT NULL DEFAULT 'draft',
  approved_at timestamptz,
  edited_at timestamptz,
  counselor_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_plan_weeks_plan
  ON plan_weeks (plan_id, week_number);

CREATE INDEX IF NOT EXISTS idx_plan_weeks_status
  ON plan_weeks (plan_id, status);

-- Seed existing approved plans: copy each week from generatedContent JSON into plan_weeks
-- so the new model works for plans approved before this migration.
-- Each week is inserted with status='approved' to preserve existing client access.
-- Plans still in 'draft' status get their weeks seeded as 'draft'.
DO $$
DECLARE
  r RECORD;
  week_content text;
  week_num integer;
  week_count integer;
BEGIN
  FOR r IN SELECT id, generated_content, status FROM plans LOOP
    BEGIN
      -- Count weeks in the JSON array
      week_count := jsonb_array_length(r.generated_content::jsonb -> 'weeks');
      FOR week_num IN 1..week_count LOOP
        week_content := (r.generated_content::jsonb -> 'weeks' -> (week_num - 1))::text;
        INSERT INTO plan_weeks (id, plan_id, week_number, content, status, approved_at, created_at)
        VALUES (
          gen_random_uuid()::text,
          r.id,
          week_num,
          week_content,
          CASE WHEN r.status = 'approved' THEN 'approved' ELSE 'draft' END,
          CASE WHEN r.status = 'approved' THEN now() ELSE NULL END,
          now()
        )
        ON CONFLICT (plan_id, week_number) DO NOTHING;
      END LOOP;
    EXCEPTION WHEN OTHERS THEN
      -- Skip plans with malformed JSON rather than failing the migration
      RAISE NOTICE 'Skipping plan % due to JSON parse error: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;

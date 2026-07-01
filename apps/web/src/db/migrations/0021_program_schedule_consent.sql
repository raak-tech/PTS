-- Program anchor, schedule request, week release tracking

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS program_anchor_date text;

ALTER TABLE client_counselor
  ADD COLUMN IF NOT EXISTS schedule_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS schedule_required_at timestamptz,
  ADD COLUMN IF NOT EXISTS schedule_completed_at timestamptz;

ALTER TABLE plan_weeks
  ADD COLUMN IF NOT EXISTS released_at timestamptz;

-- Backfill anchor from first approved week for existing approved plans
UPDATE plans p
SET program_anchor_date = to_char(COALESCE(p.approved_at, p.created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD')
WHERE p.status = 'approved' AND p.program_anchor_date IS NULL;

UPDATE plan_weeks
SET released_at = approved_at
WHERE status = 'approved' AND released_at IS NULL AND approved_at IS NOT NULL;

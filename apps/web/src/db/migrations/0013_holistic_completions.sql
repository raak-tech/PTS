-- Holistic activity completions (Ayurveda, yoga trial, music moment)

CREATE TABLE IF NOT EXISTS holistic_completions (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  date_iso text NOT NULL,
  week_number integer NOT NULL,
  activity_type text NOT NULL,
  notes text,
  completed_at timestamptz NOT NULL,
  UNIQUE (client_id, date_iso, activity_type)
);

CREATE INDEX IF NOT EXISTS idx_holistic_completions_client_date
  ON holistic_completions (client_id, date_iso);

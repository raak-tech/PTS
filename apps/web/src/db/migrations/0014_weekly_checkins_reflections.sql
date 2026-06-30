-- Weekly check-ins and evening reflections (program engagement data)

CREATE TABLE IF NOT EXISTS weekly_check_ins (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  week_number integer NOT NULL,
  week_start_iso text NOT NULL,
  answers_json text NOT NULL,
  submitted_at timestamptz NOT NULL,
  UNIQUE (client_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_check_ins_client
  ON weekly_check_ins (client_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS evening_reflections (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  date_iso text NOT NULL,
  body_text text NOT NULL,
  submitted_at timestamptz NOT NULL,
  UNIQUE (client_id, date_iso)
);

CREATE INDEX IF NOT EXISTS idx_evening_reflections_client
  ON evening_reflections (client_id, date_iso DESC);

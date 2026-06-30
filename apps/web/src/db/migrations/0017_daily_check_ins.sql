-- Daily morning check-in data (SCOPE-F)
-- Captures pain level, sleep quality, and intention each morning.
-- Feeds counselor engagement dashboard with longitudinal pain trend data.

CREATE TABLE IF NOT EXISTS daily_check_ins (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  date_iso text NOT NULL,        -- YYYY-MM-DD in client local time
  pain_level integer NOT NULL,   -- 0–10 NRS scale
  sleep_quality text NOT NULL,   -- 'poor' | 'ok' | 'good'
  intention text,                -- optional short text
  submitted_at timestamptz NOT NULL,
  UNIQUE (client_id, date_iso)
);

CREATE INDEX IF NOT EXISTS idx_daily_check_ins_client
  ON daily_check_ins (client_id, date_iso DESC);

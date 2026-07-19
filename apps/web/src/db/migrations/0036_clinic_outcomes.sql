-- Run 4 clinic outcomes: validated instruments (baseline / Week 6) and the
-- SEPARATE patient self-reported physio-exercise signal. PTS program engagement
-- is derived from existing daily activity and is never stored here as adherence.

-- Validated outcome instruments, captured at a defined phase.
CREATE TABLE IF NOT EXISTS outcome_measures (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase text NOT NULL
    CHECK (phase IN ('baseline', 'week6')),
  instrument text NOT NULL
    CHECK (instrument IN ('tsk11', 'rts', 'pseq', 'phq2', 'gad2', 'pcs')),
  score integer NOT NULL,
  raw_json text NOT NULL,
  captured_at timestamptz NOT NULL,
  UNIQUE (user_id, phase, instrument)
);

CREATE INDEX IF NOT EXISTS outcome_measures_user_idx
  ON outcome_measures(user_id);

-- Patient self-reported physio-exercise completion. Distinct from PTS program
-- engagement; always labelled patient self-report, never device verified.
CREATE TABLE IF NOT EXISTS physio_self_reports (
  id text PRIMARY KEY,
  client_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_iso text NOT NULL,
  status text NOT NULL
    CHECK (status IN ('yes', 'partly', 'no')),
  submitted_at timestamptz NOT NULL,
  UNIQUE (client_id, date_iso)
);

CREATE INDEX IF NOT EXISTS physio_self_reports_client_idx
  ON physio_self_reports(client_id);

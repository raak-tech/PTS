-- One-box intake sessions (schema existed in Drizzle but migration was missing on Neon).

CREATE TABLE IF NOT EXISTS intake_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  intake_response_id text,
  segment_type text,
  raw_text text NOT NULL,
  extraction_json text NOT NULL,
  confidence_scores text NOT NULL,
  rounds integer NOT NULL DEFAULT 1,
  overall_confidence text,
  summary text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS intake_sessions_user_id_idx ON intake_sessions(user_id);

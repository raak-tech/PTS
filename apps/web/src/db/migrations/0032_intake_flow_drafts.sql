CREATE TABLE IF NOT EXISTS intake_flow_drafts (
  user_id text PRIMARY KEY,
  payload_json text NOT NULL,
  updated_at timestamptz NOT NULL
);

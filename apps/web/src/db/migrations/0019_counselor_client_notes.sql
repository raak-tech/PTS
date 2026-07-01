-- Admin notes flagged on a specific client for the assigned counselor to see and address.
CREATE TABLE IF NOT EXISTS counselor_client_notes (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS counselor_client_notes_client_id_idx ON counselor_client_notes (client_id);
CREATE INDEX IF NOT EXISTS counselor_client_notes_unresolved_idx ON counselor_client_notes (client_id) WHERE resolved_at IS NULL;

-- Phase G — flare events (Pain Script pilot)
CREATE TABLE IF NOT EXISTS flare_events (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  pain_level INTEGER,
  trigger_text TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  severity TEXT NOT NULL DEFAULT 'low',
  safety_concern BOOLEAN NOT NULL DEFAULT false,
  intervention_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flare_events_client ON flare_events(client_id);
CREATE INDEX IF NOT EXISTS idx_flare_events_created ON flare_events(created_at);

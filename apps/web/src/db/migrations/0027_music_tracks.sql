-- §7A.3 Music tracks resolver storage (M1 pilot)
CREATE TABLE IF NOT EXISTS music_tracks (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'spotify', 'owned')),
  external_id TEXT,
  asset_url TEXT,
  title TEXT NOT NULL,
  artist TEXT,
  purpose TEXT NOT NULL,
  mood TEXT,
  language TEXT,
  duration_sec INTEGER,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_tracks_purpose ON music_tracks(purpose);

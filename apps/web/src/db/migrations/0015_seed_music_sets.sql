-- Pilot music catalog (Ramya-approved placeholders — replace spotify_uri with real playlists)

INSERT INTO music_sets (id, title, purpose_tag, spotify_uri, description, created_at)
VALUES
  (
    'music-morning-calm',
    'Morning gentle activation',
    'morning',
    'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY',
    'Low-arousal start — predictable tempo for morning grounding',
    now()
  ),
  (
    'music-pain-flare',
    'Pain flare comfort',
    'flare',
    'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
    'Slow tempo, familiar timbre — attention diversion without lyrics overload',
    now()
  ),
  (
    'music-evening-wind',
    'Evening wind-down',
    'evening',
    'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY',
    'Parasympathetic-friendly listening for end of day',
    now()
  ),
  (
    'music-reflection',
    'Reflection instrumental',
    'reflection',
    'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
    'Non-lyrical background for journaling and reflection',
    now()
  )
ON CONFLICT (id) DO NOTHING;

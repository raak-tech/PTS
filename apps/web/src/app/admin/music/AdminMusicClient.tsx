'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type MusicSet = {
  id: string;
  title: string;
  purposeTag: string;
  spotifyUri: string | null;
  description: string | null;
};

const PURPOSES = ['morning', 'flare', 'evening', 'reflection', 'activation', 'wind-down'] as const;

export function AdminMusicClient() {
  const [sets, setSets] = useState<MusicSet[]>([]);
  const [title, setTitle] = useState('');
  const [purposeTag, setPurposeTag] = useState<(typeof PURPOSES)[number]>('morning');
  const [spotifyUri, setSpotifyUri] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    void fetch('/api/admin/music', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('load');
        const data = (await res.json()) as { sets: MusicSet[] };
        setSets(data.sets);
      })
      .catch(() => setError('Could not load music catalog.'));
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/music', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          purposeTag,
          spotifyUri: spotifyUri.trim() || null,
          description: description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('save');
      setTitle('');
      setSpotifyUri('');
      setDescription('');
      load();
    } catch {
      setError('Could not save music set.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <p>
        <Link href="/admin">← Admin dashboard</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>Music catalog</h1>
      <p style={{ color: '#666' }}>Curated Spotify playlists for holistic music moments (Phase E pilot).</p>

      {error ? <p style={{ color: '#b71c1c' }}>{error}</p> : null}

      <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 17 }}>Add playlist</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={purposeTag} onChange={(e) => setPurposeTag(e.target.value as (typeof PURPOSES)[number])}>
            {PURPOSES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            placeholder="Spotify playlist URL"
            value={spotifyUri}
            onChange={(e) => setSpotifyUri(e.target.value)}
          />
          <textarea
            placeholder="Description (clinical note for counselors)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <button type="button" onClick={() => void onSave()} disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : 'Save set'}
          </button>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Catalog ({sets.length})</h2>
        {sets.map((set) => (
          <div key={set.id} style={{ borderTop: '1px solid #eee', padding: '12px 0' }}>
            <strong>{set.title}</strong>
            <div style={{ fontSize: 13, color: '#888' }}>
              {set.purposeTag} · {set.id}
            </div>
            {set.description ? <p style={{ fontSize: 14 }}>{set.description}</p> : null}
            {set.spotifyUri ? (
              <a href={set.spotifyUri} target="_blank" rel="noopener noreferrer">
                Open on Spotify
              </a>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}

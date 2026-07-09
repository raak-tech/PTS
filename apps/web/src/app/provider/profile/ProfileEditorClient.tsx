'use client';

import { useState } from 'react';

interface ProfileData {
  fullName: string;
  title: string;
  credentials: string;
  bio: string;
  calendlyUrl: string;
  specialisations: string[];
  languages: string[];
}

interface ProfileEditorClientProps {
  initialData: ProfileData;
}

export function ProfileEditorClient({ initialData }: ProfileEditorClientProps) {
  const [data, setData] = useState<ProfileData>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof ProfileData, value: string | string[]) => {
    setData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSpecialisationChange = (value: string) => {
    const list = value.split('\n').map(s => s.trim()).filter(Boolean);
    setData(prev => ({ ...prev, specialisations: list }));
  };

  const handleLanguageChange = (value: string) => {
    const list = value.split('\n').map(s => s.trim()).filter(Boolean);
    setData(prev => ({ ...prev, languages: list }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = (await res.json()) as { ok?: boolean; error?: string };

      if (!result.ok) {
        setError(result.error || 'Failed to save profile');
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Full name
        </label>
        <input
          type="text"
          value={data.fullName}
          onChange={e => handleChange('fullName', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Title
        </label>
        <input
          type="text"
          value={data.title}
          onChange={e => handleChange('title', e.target.value)}
          placeholder="e.g., Pain Rehabilitation Specialist"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Credentials
        </label>
        <input
          type="text"
          value={data.credentials}
          onChange={e => handleChange('credentials', e.target.value)}
          placeholder="e.g., PT, DPT, CSCS"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Bio
        </label>
        <textarea
          value={data.bio}
          onChange={e => handleChange('bio', e.target.value)}
          rows={4}
          placeholder="Tell clients about your approach and experience"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Calendly URL
        </label>
        <input
          type="url"
          value={data.calendlyUrl}
          onChange={e => handleChange('calendlyUrl', e.target.value)}
          placeholder="https://calendly.com/yourname"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Specialisations (one per line)
        </label>
        <textarea
          value={data.specialisations.join('\n')}
          onChange={e => handleSpecialisationChange(e.target.value)}
          rows={3}
          placeholder="e.g. Back pain&#10;Chronic pain&#10;Sports injuries"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Languages (one per line)
        </label>
        <textarea
          value={data.languages.join('\n')}
          onChange={e => handleLanguageChange(e.target.value)}
          rows={2}
          placeholder="e.g. English&#10;Hindi&#10;Spanish"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {error && (
        <div style={{ padding: 12, backgroundColor: '#fee2e2', borderRadius: 8, color: '#991b1b', fontSize: 14 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: 12, backgroundColor: '#dcfce7', borderRadius: 8, color: '#166534', fontSize: 14 }}>
          Profile saved successfully
        </div>
      )}

      <button
        onClick={() => void handleSave()}
        disabled={saving}
        style={{
          padding: '10px 16px',
          fontSize: 14,
          fontWeight: 600,
          backgroundColor: saving ? 'var(--muted)' : 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? 'Saving...' : 'Save profile'}
      </button>
    </div>
  );
}

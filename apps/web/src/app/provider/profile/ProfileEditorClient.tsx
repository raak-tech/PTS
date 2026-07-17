'use client';

import { useState } from 'react';

interface ProfileData {
  fullName: string;
  title: string;
  credentials: string;
  bio: string;
  yearsExperience: string;
  calendlyUrl: string;
  sessionJoinUrl: string;
  specialisations: string[];
  languages: string[];
}

interface ProfileEditorClientProps {
  initialData: ProfileData;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 14,
  border: '1px solid var(--border)',
  borderRadius: 8,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 6,
};

const hintStyle: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: 12,
  color: 'var(--muted)',
  lineHeight: 1.45,
};

export function ProfileEditorClient({ initialData }: ProfileEditorClientProps) {
  const [data, setData] = useState<ProfileData>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof ProfileData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSpecialisationChange = (value: string) => {
    const list = value.split('\n').map((s) => s.trim()).filter(Boolean);
    setData((prev) => ({ ...prev, specialisations: list }));
  };

  const handleLanguageChange = (value: string) => {
    const list = value.split('\n').map((s) => s.trim()).filter(Boolean);
    setData((prev) => ({ ...prev, languages: list }));
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
        <label style={labelStyle}>Full name</label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Title</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Pain recovery counselor"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Credentials</label>
        <input
          type="text"
          value={data.credentials}
          onChange={(e) => handleChange('credentials', e.target.value)}
          placeholder="e.g., M.Sc. Psychology"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Years of experience</label>
        <input
          type="text"
          value={data.yearsExperience}
          onChange={(e) => handleChange('yearsExperience', e.target.value)}
          placeholder="e.g., 5 years"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Bio</label>
        <textarea
          value={data.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          rows={4}
          placeholder="Tell clients about your approach and experience"
          style={{ ...inputStyle, fontFamily: 'inherit' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Calendly URL (booking)</label>
        <input
          type="url"
          value={data.calendlyUrl}
          onChange={(e) => handleChange('calendlyUrl', e.target.value)}
          placeholder="https://calendly.com/yourname"
          style={inputStyle}
        />
        <p style={hintStyle}>Clients use this to book a session. Keep titles generic (e.g. “PTS session”).</p>
      </div>

      <div>
        <label style={labelStyle}>Next session join link (optional)</label>
        <input
          type="url"
          value={data.sessionJoinUrl}
          onChange={(e) => handleChange('sessionJoinUrl', e.target.value)}
          placeholder="https://whereby.com/… or Meet guest link"
          style={inputStyle}
        />
        <p style={hintStyle}>
          Paste a one-time room link when a live session is upcoming. Clear it after the session. Prefer guest
          links — not your personal recurring Meet ID.
        </p>
      </div>

      <div>
        <label style={labelStyle}>Specialisations (one per line)</label>
        <textarea
          value={data.specialisations.join('\n')}
          onChange={(e) => handleSpecialisationChange(e.target.value)}
          rows={3}
          placeholder={'e.g. Back pain\nChronic pain\nSports injuries'}
          style={{ ...inputStyle, fontFamily: 'inherit' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Languages (one per line)</label>
        <textarea
          value={data.languages.join('\n')}
          onChange={(e) => handleLanguageChange(e.target.value)}
          rows={2}
          placeholder={'e.g. English\nTamil\nHindi'}
          style={{ ...inputStyle, fontFamily: 'inherit' }}
        />
      </div>

      {error ? (
        <div style={{ padding: 12, backgroundColor: '#fee2e2', borderRadius: 8, color: '#991b1b', fontSize: 14 }}>
          {error}
        </div>
      ) : null}

      {success ? (
        <div style={{ padding: 12, backgroundColor: '#dcfce7', borderRadius: 8, color: '#166534', fontSize: 14 }}>
          Profile saved successfully
        </div>
      ) : null}

      <button
        type="button"
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

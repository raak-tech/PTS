'use client';

import { useEffect, useState } from 'react';

import { AdminNav } from '@/components/admin/AdminNav';

type Member = {
  membershipId: string;
  userId: string;
  role: 'referrer' | 'clinic_admin';
  email: string;
  displayName: string | null;
};

type Clinic = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  status: string;
  members: Member[];
};

export function AdminClinicsClient() {
  const [clinics, setClinics] = useState<Clinic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    void fetch('/api/admin/clinics', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { ok?: boolean; clinics?: Clinic[]; error?: string }) => {
        if (d.ok && d.clinics) setClinics(d.clinics);
        else setError(d.error ?? 'failed');
      })
      .catch(() => setError('network'));
  };

  useEffect(load, []);

  const removeMember = async (clinicId: string, membershipId: string) => {
    if (!confirm('Remove this staff member from the clinic?')) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/clinics/${clinicId}/members/${membershipId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', color: '#111' }}>
      <AdminNav current="/admin/clinics" />
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>Clinics</h1>
      <p style={{ color: '#555', margin: '0 0 24px' }}>
        Manage clinic staff. <strong>Referrers</strong> see only their own patients; <strong>clinic admins</strong> see
        the clinic aggregate and billing.
      </p>

      {error && <p style={{ color: '#b71c1c' }}>Error: {error}</p>}
      {!clinics && !error && <p style={{ color: '#555' }}>Loading…</p>}

      {clinics?.map((clinic) => (
        <section key={clinic.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{clinic.name}</h2>
            <span style={{ fontSize: 13, color: clinic.status === 'active' ? '#1b8a4b' : '#b71c1c' }}>{clinic.status}</span>
          </div>
          <p style={{ fontSize: 13, color: '#888', margin: '2px 0 14px' }}>{clinic.city ?? '—'} · {clinic.slug}</p>

          {clinic.members.length === 0 ? (
            <p style={{ color: '#888', fontSize: 14 }}>No staff yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 14 }}>
              <tbody>
                {clinic.members.map((m) => (
                  <tr key={m.membershipId} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '8px 6px' }}>{m.displayName ?? '—'}</td>
                    <td style={{ padding: '8px 6px', color: '#555' }}>{m.email}</td>
                    <td style={{ padding: '8px 6px', fontWeight: 600 }}>{m.role.replace('_', ' ')}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                      <button
                        onClick={() => void removeMember(clinic.id, m.membershipId)}
                        disabled={busy}
                        style={{ color: '#b71c1c', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <AddMemberForm clinicId={clinic.id} onAdded={load} />
        </section>
      ))}
    </main>
  );
}

function AddMemberForm({ clinicId, onAdded }: { clinicId: string; onAdded: () => void }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'referrer' | 'clinic_admin'>('referrer');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          displayName: displayName.trim(),
          role,
          ...(password.trim() ? { password: password.trim() } : {}),
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        setMsg(`Error: ${d.error ?? 'failed'}`);
      } else {
        setMsg(d.created ? 'Staff account created and added.' : 'Existing user added / updated.');
        setEmail('');
        setDisplayName('');
        setPassword('');
        onAdded();
      }
    } catch {
      setMsg('Error: network');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid #ccc', fontSize: 14, color: '#111' };

  return (
    <div style={{ background: '#fafafa', borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Add staff</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, flex: '1 1 180px' }} />
        <input placeholder="Full name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ ...inputStyle, flex: '1 1 150px' }} />
        <select value={role} onChange={(e) => setRole(e.target.value as 'referrer' | 'clinic_admin')} style={inputStyle}>
          <option value="referrer">referrer</option>
          <option value="clinic_admin">clinic admin</option>
        </select>
        <input placeholder="Temp password (new user)" type="text" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, flex: '1 1 160px' }} />
        <button
          onClick={() => void submit()}
          disabled={saving || !email.trim() || displayName.trim().length < 2}
          style={{ padding: '9px 16px', borderRadius: 999, border: 'none', background: '#111', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
      {msg && <p style={{ fontSize: 13, marginTop: 8, color: msg.startsWith('Error') ? '#b71c1c' : '#1b8a4b' }}>{msg}</p>}
      <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
        New staff sign in at <code>/login</code> with their email + temp password. Existing referrer/admin emails are just linked.
      </p>
    </div>
  );
}

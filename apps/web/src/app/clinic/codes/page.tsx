'use client';

import { useEffect, useState } from 'react';

import { webTheme as t } from '@/lib/web-theme';

type CodeRow = {
  id: string;
  code: string;
  cohortLabel: string | null;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  createdAt?: string;
  expired?: boolean;
  exhausted?: boolean;
};

export default function ClinicCodesPage() {
  const [codes, setCodes] = useState<CodeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cohort, setCohort] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = () => {
    void fetch('/api/clinic/codes', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { ok?: boolean; codes?: CodeRow[]; error?: string }) => {
        if (d.ok && d.codes) setCodes(d.codes);
        else setError(d.error ?? 'failed');
      })
      .catch(() => setError('network'));
  };

  useEffect(load, []);

  const revoke = async (id: string) => {
    if (!confirm('Revoke this code? It can no longer be redeemed. Existing enrollments are unaffected.')) return;
    setRevokingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/codes/${id}`, { method: 'DELETE', credentials: 'include' });
      const d = await res.json();
      if (!res.ok || !d.ok) setError(d.error ?? 'revoke_failed');
      else load();
    } catch {
      setError('network');
    } finally {
      setRevokingId(null);
    }
  };

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (cohort.trim()) body.cohortLabel = cohort.trim();
      if (maxUses.trim()) body.maxUses = Number(maxUses.trim());
      if (expiresInDays.trim()) body.expiresInDays = Number(expiresInDays.trim());
      const res = await fetch('/api/clinic/codes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        setError(d.error ?? 'failed');
      } else {
        setCohort('');
        setMaxUses('');
        setExpiresInDays('');
        load();
      }
    } catch {
      setError('network');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>Enrollment codes</h1>
      <p style={{ color: t.textMuted, margin: '0 0 24px', maxWidth: 720 }}>
        Generate a code for a patient or cohort. Patients enter it in the app during sign-up, then
        separately consent to sharing progress with the clinic.
      </p>

      <div
        style={{
          background: '#fff',
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: 20,
          maxWidth: 560,
          marginBottom: 28,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>New code</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <Field label="Cohort label (optional)">
            <input value={cohort} onChange={(e) => setCohort(e.target.value)} placeholder="e.g. ACL Jan cohort" style={input} />
          </Field>
          <Field label="Max uses (optional)">
            <input value={maxUses} onChange={(e) => setMaxUses(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Leave blank for unlimited" style={input} />
          </Field>
          <Field label="Expires in days (optional)">
            <input value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Leave blank for no expiry" style={input} />
          </Field>
          <button
            onClick={create}
            disabled={creating}
            style={{ padding: '11px', borderRadius: 999, border: 'none', background: t.bg, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: creating ? 0.6 : 1 }}
          >
            {creating ? 'Generating…' : 'Generate code'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: t.danger }}>Error: {error}</p>}
      {!codes && !error && <p style={{ color: t.textMuted }}>Loading…</p>}
      {codes && codes.length === 0 && <p style={{ color: t.textMuted }}>No codes yet.</p>}

      {codes && codes.length > 0 && (
        <div style={{ overflowX: 'auto', border: `1px solid ${t.border}`, borderRadius: 12 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14, background: '#fff' }}>
            <thead>
              <tr style={{ background: t.surfaceMuted, textAlign: 'left' }}>
                <th style={th}>Code</th>
                <th style={th}>Cohort</th>
                <th style={th}>Uses</th>
                <th style={th}>Expires</th>
                <th style={th}>Status</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => {
                const inactive = c.expired || c.exhausted;
                return (
                  <tr key={c.id} style={{ borderTop: `1px solid ${t.borderLight}` }}>
                    <td style={{ ...td, fontFamily: 'monospace', fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>{c.code}</td>
                    <td style={td}>{c.cohortLabel ?? '—'}</td>
                    <td style={td}>{c.uses}{c.maxUses != null ? ` / ${c.maxUses}` : ''}</td>
                    <td style={td}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'never'}</td>
                    <td style={td}>
                      {c.expired ? <span style={{ color: t.danger }}>expired</span> : c.exhausted ? <span style={{ color: t.danger }}>exhausted</span> : <span style={{ color: '#1b8a4b' }}>active</span>}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {!inactive && (
                        <button
                          onClick={() => void revoke(c.id)}
                          disabled={revokingId === c.id}
                          style={{ color: t.danger, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                        >
                          {revokingId === c.id ? 'Revoking…' : 'Revoke'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 5 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: t.textSecondary }}>{label}</span>
      {children}
    </label>
  );
}

const input: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: `1.5px solid ${t.border}`,
  fontSize: 15,
  fontFamily: 'inherit',
  color: t.text,
  background: '#fff',
};
const th: React.CSSProperties = { padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '12px 14px' };

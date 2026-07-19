'use client';

import { useEffect, useState } from 'react';

import { webTheme as t } from '@/lib/web-theme';

type PatientRow = {
  enrollmentId: string;
  patientLabel: string;
  cohortLabel: string | null;
  status: string;
  referrerUserId: string | null;
  currentWeek: number;
  ptsEngagement: { engagedDays30: number; lastActiveAt: string | null; state: string };
  physioSelfReport: { reportedDays30: number; completionPct: number | null; lastStatus: string | null };
};

type Referrer = { userId: string; displayName: string | null };

const STATE_COLOR: Record<string, string> = {
  active: '#1b8a4b',
  slipping: '#b8860b',
  inactive: '#b71c1c',
};

const STATUS_OPTIONS = ['enrolled', 'active', 'graduated', 'withdrawn'] as const;

export default function ClinicPatientsPage() {
  const [rows, setRows] = useState<PatientRow[] | null>(null);
  const [role, setRole] = useState<'referrer' | 'clinic_admin' | null>(null);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    void fetch('/api/clinic/patients', { credentials: 'include' })
      .then((r) => r.json())
      .then(
        (d: {
          ok?: boolean;
          patients?: PatientRow[];
          role?: 'referrer' | 'clinic_admin';
          referrers?: Referrer[];
          error?: string;
        }) => {
          if (d.ok && d.patients) {
            setRows(d.patients);
            setRole(d.role ?? null);
            setReferrers(d.referrers ?? []);
          } else setError(d.error ?? 'failed');
        },
      )
      .catch(() => setError('network'));
  };

  useEffect(load, []);

  const patch = async (enrollmentId: string, body: Record<string, unknown>) => {
    setSavingId(enrollmentId);
    try {
      const res = await fetch(`/api/clinic/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) setError(d.error ?? 'update_failed');
      else load();
    } catch {
      setError('network');
    } finally {
      setSavingId(null);
    }
  };

  const isAdmin = role === 'clinic_admin';

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>Patients</h1>
      <p style={{ color: t.textMuted, margin: '0 0 8px', maxWidth: 720 }}>
        Consented patients only. You see engagement and high-level progress — never messages,
        counselling notes, or plan detail.
      </p>
      <div
        style={{
          background: '#fff8e6',
          border: `1px solid ${t.accent}`,
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 13,
          color: t.textSecondary,
          maxWidth: 720,
          marginBottom: 20,
        }}
      >
        <strong>PTS program engagement</strong> (psychological practices) and{' '}
        <strong>physio exercises (self-reported)</strong> are two different things. Physio exercise
        completion is the patient&apos;s own self-report, not device verified.
      </div>

      {error && <p style={{ color: t.danger }}>Could not complete request ({error}).</p>}
      {!rows && !error && <p style={{ color: t.textMuted }}>Loading…</p>}
      {rows && rows.length === 0 && (
        <p style={{ color: t.textMuted }}>
          No consented patients yet. Share an enrollment code and ask patients to opt in to sharing.
        </p>
      )}

      {rows && rows.length > 0 && (
        <div style={{ overflowX: 'auto', border: `1px solid ${t.border}`, borderRadius: 12 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14, background: '#fff' }}>
            <thead>
              <tr style={{ background: t.surfaceMuted, textAlign: 'left' }}>
                <th style={th}>Patient</th>
                <th style={th}>Cohort</th>
                <th style={th}>Status</th>
                {isAdmin && <th style={th}>Referrer</th>}
                <th style={th}>Week</th>
                <th style={th}>PTS engagement (30d)</th>
                <th style={th}>Physio exercises (self-report, 30d)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.enrollmentId} style={{ borderTop: `1px solid ${t.borderLight}` }}>
                  <td style={td}>{r.patientLabel}</td>
                  <td style={td}>{r.cohortLabel ?? '—'}</td>
                  <td style={td}>
                    <select
                      value={r.status}
                      disabled={savingId === r.enrollmentId}
                      onChange={(e) => void patch(r.enrollmentId, { status: e.target.value })}
                      style={select}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      {!STATUS_OPTIONS.includes(r.status as (typeof STATUS_OPTIONS)[number]) && (
                        <option value={r.status}>{r.status}</option>
                      )}
                    </select>
                  </td>
                  {isAdmin && (
                    <td style={td}>
                      <select
                        value={r.referrerUserId ?? ''}
                        disabled={savingId === r.enrollmentId}
                        onChange={(e) =>
                          void patch(r.enrollmentId, { referrerUserId: e.target.value || null })
                        }
                        style={select}
                      >
                        <option value="">(unassigned)</option>
                        {referrers.map((ref) => (
                          <option key={ref.userId} value={ref.userId}>
                            {ref.displayName ?? ref.userId.slice(-4)}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td style={td}>{r.currentWeek > 0 ? `Week ${r.currentWeek}` : '—'}</td>
                  <td style={td}>
                    <span style={{ color: STATE_COLOR[r.ptsEngagement.state] ?? t.text, fontWeight: 600 }}>
                      {r.ptsEngagement.state}
                    </span>{' '}
                    · {r.ptsEngagement.engagedDays30} day{r.ptsEngagement.engagedDays30 === 1 ? '' : 's'}
                  </td>
                  <td style={td}>
                    {r.physioSelfReport.reportedDays30 === 0 ? (
                      <span style={{ color: t.textMuted }}>no self-reports</span>
                    ) : (
                      <>
                        {r.physioSelfReport.completionPct}% over {r.physioSelfReport.reportedDays30} day
                        {r.physioSelfReport.reportedDays30 === 1 ? '' : 's'}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'top' };
const select: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 8,
  border: `1.5px solid ${t.border}`,
  fontSize: 13,
  color: t.text,
  background: '#fff',
};

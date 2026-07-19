'use client';

import { useEffect, useState } from 'react';

import { webTheme as t } from '@/lib/web-theme';

type Billing = {
  month: string;
  activePatients: number;
  rows: { pseudoId: string; status: string; engagedDaysInMonth: number }[];
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function ClinicBillingPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<Billing | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    void fetch(`/api/clinic/billing?month=${month}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { ok?: boolean; billing?: Billing; error?: string }) => {
        if (d.ok && d.billing) setData(d.billing);
        else setError(d.error ?? 'failed');
      })
      .catch(() => setError('network'));
  }, [month]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Billing</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${t.border}`, fontSize: 14 }} />
          <a href={`/api/clinic/billing?month=${month}&format=csv`} style={{ padding: '9px 14px', borderRadius: 999, background: t.bg, color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            Export CSV
          </a>
        </div>
      </div>
      <p style={{ color: t.textMuted, margin: '6px 0 20px', maxWidth: 720 }}>
        An active patient is one who is in-program and completed at least one PTS engagement in the
        month. Pilot invoices are issued manually from this meter.
      </p>

      {error && <p style={{ color: t.danger }}>Could not load ({error === 'forbidden' ? 'clinic admin only' : error}).</p>}
      {!data && !error && <p style={{ color: t.textMuted }}>Loading…</p>}

      {data && (
        <>
          <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 22, display: 'inline-block' }}>
            <div style={{ fontSize: 40, fontWeight: 800 }}>{data.activePatients}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.textSecondary }}>active patients · {data.month}</div>
          </div>

          {data.rows.length > 0 && (
            <div style={{ overflowX: 'auto', border: `1px solid ${t.border}`, borderRadius: 12 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14, background: '#fff' }}>
                <thead>
                  <tr style={{ background: t.surfaceMuted, textAlign: 'left' }}>
                    <th style={th}>Patient ID</th>
                    <th style={th}>Status</th>
                    <th style={th}>Engaged days in month</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.pseudoId} style={{ borderTop: `1px solid ${t.borderLight}` }}>
                      <td style={{ ...td, fontFamily: 'monospace' }}>{r.pseudoId}</td>
                      <td style={td}>{r.status}</td>
                      <td style={td}>{r.engagedDaysInMonth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '12px 14px' };

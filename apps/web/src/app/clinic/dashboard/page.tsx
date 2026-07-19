'use client';

import { useEffect, useState } from 'react';

import { webTheme as t } from '@/lib/web-theme';

type Rate = { value: number | null; n: number; suppressed: boolean };
type Delta = { mean: number | null; n: number; suppressed: boolean; betterDirection: 'lower' | 'higher'; label: string };

type Dashboard = {
  counts: { enrolled: number; activeThisMonth: number; graduated: number; withdrawn: number };
  ptsEngagement: { engagedLast7: Rate; meanEngagedDays30: number | null; n: number };
  physioSelfReport: { meanCompletionPct: Rate };
  retention: { day7: Rate; day14: Rate; week6: Rate };
  outcomeDeltas: Delta[];
  dropoutStage: { label: string; count: number }[] | null;
  month: string;
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function ClinicDashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    void fetch(`/api/clinic/dashboard?month=${month}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { ok?: boolean; dashboard?: Dashboard; error?: string }) => {
        if (d.ok && d.dashboard) setData(d.dashboard);
        else setError(d.error ?? 'failed');
      })
      .catch(() => setError('network'));
  }, [month]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Outcomes</h1>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${t.border}`, fontSize: 14 }} />
      </div>
      <p style={{ color: t.textMuted, margin: '6px 0 20px', maxWidth: 720 }}>
        Aggregate and de-identified. Cells built from fewer than 5 patients are hidden to protect
        privacy. Every rate shows the number of patients it is based on (n).
      </p>

      {error && <p style={{ color: t.danger }}>Could not load ({error === 'forbidden' ? 'clinic admin only' : error}).</p>}
      {!data && !error && <p style={{ color: t.textMuted }}>Loading…</p>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 26 }}>
            <Stat label="Enrolled" value={data.counts.enrolled} />
            <Stat label="Active this month" value={data.counts.activeThisMonth} sub="≥1 PTS engagement" />
            <Stat label="Graduated" value={data.counts.graduated} />
            <Stat label="Withdrawn" value={data.counts.withdrawn} />
          </div>

          <Section title="Engagement (two separate signals)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
              <Card title="PTS program engagement" hint="Psychological practices — not physio adherence">
                <RateLine label="Active in last 7 days" rate={data.ptsEngagement.engagedLast7} />
                <p style={{ margin: '8px 0 0', fontSize: 14 }}>
                  Mean engaged days (30d): <strong>{data.ptsEngagement.meanEngagedDays30 ?? '—'}</strong> <span style={{ color: t.textMuted }}>(n={data.ptsEngagement.n})</span>
                </p>
              </Card>
              <Card title="Physio exercises (self-reported)" hint="Patient self-report only, not device verified">
                <RateLine label="Mean completion" rate={data.physioSelfReport.meanCompletionPct} suffix="%" />
              </Card>
            </div>
          </Section>

          <Section title="Retention">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              <Card title="Day 7"><RateLine label="Still engaging" rate={data.retention.day7} suffix="%" /></Card>
              <Card title="Day 14"><RateLine label="Still engaging" rate={data.retention.day14} suffix="%" /></Card>
              <Card title="Week 6"><RateLine label="Still engaging" rate={data.retention.week6} suffix="%" /></Card>
            </div>
          </Section>

          <Section title="Outcome change (Week 6 − baseline)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
              {data.outcomeDeltas.map((d) => (
                <Card key={d.label} title={d.label} hint={`Lower is better → ${d.betterDirection === 'lower' ? 'improvement is negative' : 'improvement is positive'}`}>
                  {d.suppressed ? (
                    <p style={{ margin: 0, color: t.textMuted }}>Hidden (n={d.n}, need ≥5)</p>
                  ) : (
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
                      {d.mean != null && d.mean > 0 ? '+' : ''}{d.mean} <span style={{ fontSize: 13, fontWeight: 500, color: t.textMuted }}>(n={d.n})</span>
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </Section>

          {data.dropoutStage && (
            <Section title="Where patients drop off">
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {data.dropoutStage.map((s) => (
                  <div key={s.label}><strong style={{ fontSize: 20 }}>{s.count}</strong> <span style={{ color: t.textMuted }}>{s.label}</span></div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 30, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: t.textSecondary }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>{title}</h2>
      {children}
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
      {hint && <div style={{ fontSize: 11, color: t.textMuted, margin: '2px 0 10px' }}>{hint}</div>}
      {children}
    </div>
  );
}

function RateLine({ label, rate, suffix }: { label: string; rate: Rate; suffix?: string }) {
  return (
    <p style={{ margin: 0, fontSize: 14 }}>
      {label}:{' '}
      {rate.suppressed ? (
        <span style={{ color: t.textMuted }}>hidden (n={rate.n})</span>
      ) : (
        <strong style={{ fontSize: 18 }}>{rate.value}{suffix ?? '%'} <span style={{ fontSize: 12, fontWeight: 500, color: t.textMuted }}>(n={rate.n})</span></strong>
      )}
    </p>
  );
}

'use client';

import { useEffect, useState } from 'react';

type Summary = {
  weekStart: string;
  weekEnd: string;
  reinforcementResponses: number;
  reinforcementDaysActive: number;
  calendarDaysPlanned: number;
  blocksCompleted: number;
  blocksPartial: number;
  blocksSkipped: number;
  eveningReflectionCount: number;
  painTrend: string | null;
  latestWeeklyCheckIn: string | null;
  morningCheckIns: { dateIso: string; painLevel: number; sleepQuality: string; intention: string | null }[];
  holisticCompletions: { activityType: string; count: number }[];
  practiceFeelingSamples: string[];
  readOutSummaries: string[];
  eveningReflectionSamples: string[];
  scheduleInsights: string[];
  clientShares: string[];
};

type ActivityResponse = {
  ok: boolean;
  anchored: boolean;
  summary: Summary | null;
};

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: 'good' | 'warn' | 'bad' }) {
  const color =
    tone === 'good' ? 'var(--success)' : tone === 'warn' ? 'var(--warning)' : tone === 'bad' ? 'var(--danger)' : 'var(--text)';
  return (
    <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10, minWidth: 96 }}>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</p>
    </div>
  );
}

export function WeekActivityPanel({ clientId, weekNumber }: { clientId: string; weekNumber: number }) {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/provider/clients/${clientId}/week/${weekNumber}/activity`, { credentials: 'include' })
      .then((r) => r.json())
      .then((json: ActivityResponse) => {
        if (cancelled) return;
        if (!json.ok) {
          setError('Could not load activity for this week.');
          return;
        }
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setError('Network error loading activity.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, weekNumber]);

  if (loading) {
    return <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading Week {weekNumber} activity…</p>;
  }
  if (error) {
    return <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>;
  }
  if (!data?.anchored || !data.summary) {
    return (
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>
        No activity yet — this appears once Week 1 is approved and the client starts engaging.
      </p>
    );
  }

  const s = data.summary;
  const blocksTotal = s.blocksCompleted + s.blocksPartial + s.blocksSkipped;
  const completionPct = blocksTotal > 0 ? Math.round((s.blocksCompleted / blocksTotal) * 100) : null;

  return (
    <div>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--muted)' }}>
        {s.weekStart} → {s.weekEnd}
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Stat label="Read-outs" value={s.reinforcementResponses} tone={s.reinforcementResponses > 0 ? 'good' : 'warn'} />
        <Stat
          label="Blocks done"
          value={completionPct !== null ? `${completionPct}%` : '—'}
          tone={completionPct === null ? undefined : completionPct >= 60 ? 'good' : completionPct >= 30 ? 'warn' : 'bad'}
        />
        <Stat label="Check-ins" value={s.morningCheckIns.length} tone={s.morningCheckIns.length > 0 ? 'good' : 'warn'} />
        <Stat label="Reflections" value={s.eveningReflectionCount} />
      </div>

      {s.painTrend ? (
        <p style={{ margin: '0 0 12px', fontSize: 13, padding: '8px 12px', background: 'var(--accent-soft)', borderRadius: 8 }}>
          {s.painTrend}
        </p>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Calendar blocks
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            {s.blocksCompleted} done · {s.blocksPartial} partial · {s.blocksSkipped} skipped
            <br />
            {s.calendarDaysPlanned} day(s) planned
          </p>
        </div>

        {s.holisticCompletions.length > 0 ? (
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Holistic activities
            </p>
            <p style={{ margin: 0, fontSize: 13 }}>
              {s.holisticCompletions.map((h) => `${h.activityType} ×${h.count}`).join(' · ')}
            </p>
          </div>
        ) : null}

        {s.morningCheckIns.length > 0 ? (
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Morning check-ins
            </p>
            {s.morningCheckIns.map((c) => (
              <p key={c.dateIso} style={{ margin: '0 0 3px', fontSize: 13 }}>
                {c.dateIso}: pain {c.painLevel}/10, sleep {c.sleepQuality}
                {c.intention ? ` — “${c.intention}”` : ''}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {s.practiceFeelingSamples.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Practice reflections
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
            {s.practiceFeelingSamples.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {s.readOutSummaries.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Read-out responses
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
            {s.readOutSummaries.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {s.eveningReflectionSamples.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Evening reflections
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
            {s.eveningReflectionSamples.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {s.scheduleInsights.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Schedule feedback
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
            {s.scheduleInsights.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {s.latestWeeklyCheckIn ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Latest weekly check-in
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>{s.latestWeeklyCheckIn}</p>
        </div>
      ) : null}
    </div>
  );
}

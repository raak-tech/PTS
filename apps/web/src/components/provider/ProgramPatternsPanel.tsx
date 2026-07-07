'use client';

import { useEffect, useState } from 'react';

type WeekMetric = {
  week: number;
  readOuts: number;
  blockCompletionPct: number | null;
  checkIns: number;
  avgPain: number | null;
  reflections: number;
  holisticTotal: number;
};

type MetricsResponse = {
  ok: boolean;
  anchored: boolean;
  weeks: WeekMetric[];
  patterns: string[];
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  fontSize: 11,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  borderBottom: '1px solid var(--border-light)',
};

const td: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 13,
  borderBottom: '1px solid var(--border-light)',
};

export function ProgramPatternsPanel({ clientId }: { clientId: string }) {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/provider/clients/${clientId}/program-metrics`, { credentials: 'include' })
      .then((r) => r.json())
      .then((json: MetricsResponse) => {
        if (cancelled) return;
        if (!json.ok) {
          setError('Could not load program metrics.');
          return;
        }
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setError('Network error loading program metrics.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (loading) return <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading patterns…</p>;
  if (error) return <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>;
  if (!data?.anchored || data.weeks.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>
        Cross-week patterns appear once at least one week is approved and the client has engagement history.
      </p>
    );
  }

  return (
    <div>
      {data.patterns.length > 0 ? (
        <ul style={{ margin: '0 0 14px', paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
          {data.patterns.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      ) : null}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={th}>Week</th>
              <th style={th}>Blocks done</th>
              <th style={th}>Read-outs</th>
              <th style={th}>Check-ins</th>
              <th style={th}>Avg pain</th>
              <th style={th}>Reflections</th>
              <th style={th}>Holistic</th>
            </tr>
          </thead>
          <tbody>
            {data.weeks.map((w) => (
              <tr key={w.week}>
                <td style={{ ...td, fontWeight: 600 }}>Week {w.week}</td>
                <td style={td}>{w.blockCompletionPct !== null ? `${w.blockCompletionPct}%` : '—'}</td>
                <td style={td}>{w.readOuts}</td>
                <td style={td}>{w.checkIns}</td>
                <td style={td}>{w.avgPain !== null ? `${w.avgPain}/10` : '—'}</td>
                <td style={td}>{w.reflections}</td>
                <td style={td}>{w.holisticTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

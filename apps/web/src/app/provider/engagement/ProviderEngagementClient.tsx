'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PainSparkline } from '@/components/PainSparkline';

type EngagementClient = {
  clientId: string;
  name: string;
  reinforcementTitle: string | null;
  reinforcementRecordedToday: boolean;
  calendarBlocksTotal: number;
  calendarBlocksDone: number;
  holisticDone?: number;
  holisticTotal?: number;
  needsAttention: boolean;
  recentClientShareCount?: number;
  hasRecentClientShare?: boolean;
  painLevels?: { dateIso: string; painLevel: number }[];
};

export function ProviderEngagementClient() {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [clients, setClients] = useState<EngagementClient[]>([]);

  useEffect(() => {
    void fetch('/api/provider/engagement', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { date?: string; clients?: EngagementClient[] }) => {
        setDate(data.date ?? '');
        setClients(data.clients ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="pageShell" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Daily engagement</h1>
        <Link href="/provider" className="actionLink secondary">← Console</Link>
      </div>

      <p style={{ color: '#555', marginTop: 0 }}>
        {date ? `Today (${date})` : 'Today'} — reinforcement recordings and calendar stickiness for your assigned clients.
      </p>

      {loading ? (
        <p>Loading…</p>
      ) : clients.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 18 }}>
          <p style={{ margin: 0 }}>No assigned clients yet.</p>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>Clients appear here after you approve their plan.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {clients.map((c) => (
            <article
              key={c.clientId}
              style={{
                border: `1px solid ${c.needsAttention ? '#ffc107' : 'var(--border)'}`,
                borderRadius: 16,
                padding: 16,
                background: c.needsAttention ? '#fffde7' : 'var(--surface-2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 16 }}>{c.name}</h2>
                  {c.hasRecentClientShare ? (
                    <span
                      title="New client update in the last 7 days"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#1565c0',
                        background: '#e3f2fd',
                        border: '1px solid #90caf9',
                        borderRadius: 999,
                        padding: '2px 8px',
                      }}
                    >
                      💬 Client update{(c.recentClientShareCount ?? 0) > 1 ? ` ×${c.recentClientShareCount}` : ''}
                    </span>
                  ) : null}
                </div>
                {c.needsAttention ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#e65100' }}>Needs attention</span>
                ) : (
                  <span style={{ fontSize: 12, color: '#2e7d32' }}>On track</span>
                )}
              </div>
              <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                <li>
                  <strong>Read-out:</strong>{' '}
                  {c.reinforcementTitle ?? 'None assigned'}
                  {c.reinforcementTitle
                    ? c.reinforcementRecordedToday
                      ? ' · ✓ recorded today'
                      : ' · ○ not recorded today'
                    : ''}
                </li>
                <li>
                  <strong>Calendar:</strong> {c.calendarBlocksDone}/{c.calendarBlocksTotal} blocks done
                </li>
                <li>
                  <strong>Holistic cards:</strong> {c.holisticDone ?? 0}/{c.holisticTotal ?? 4} (Ayurveda, yoga, music, practice)
                </li>
              </ul>
              {(c.painLevels?.length ?? 0) >= 2 ? (
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Pain (7d)</span>
                  <PainSparkline
                    points={(c.painLevels ?? []).map((p) => ({ value: p.painLevel, label: p.dateIso }))}
                    width={140}
                    height={28}
                  />
                </div>
              ) : null}
              <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href={`/provider/clients/${c.clientId}`} className="actionLink secondary">
                  Client workspace
                </Link>
                <Link href={`/messages?with=${c.clientId}`} className="actionLink secondary">
                  Message
                </Link>
                <Link href={`/provider/plans`} className="actionLink secondary">
                  Plans
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

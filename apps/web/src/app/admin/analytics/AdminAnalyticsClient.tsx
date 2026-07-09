'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AdminNav } from '@/components/admin/AdminNav';
import { BarChart, LineChart, StatGrid } from '@/components/admin/AdminCharts';

type Analytics = {
  range: { days: number };
  signups: { date: string; count: number }[];
  activeUsers: { date: string; count: number }[];
  dau: number;
  wau: number;
  funnel: {
    clients: number;
    intakes: number;
    plans: number;
    approvedPlans: number;
    activeInRange: number;
  };
  retentionByWeek: { week: number; clientsWithCheckIn: number }[];
  llm: {
    totalCostUsd: number;
    costByDay: { date: string; costUsd: number }[];
  };
};

export function AdminAnalyticsClient() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    void fetch(`/api/admin/analytics?days=${days}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setData(d as Analytics))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>
      <AdminNav current="/admin/analytics" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading || !data ? (
        <p>Loading analytics…</p>
      ) : (
        <>
          <StatGrid
            items={[
              { label: 'DAU', value: data.dau },
              { label: 'WAU', value: data.wau },
              { label: 'Clients', value: data.funnel.clients },
              { label: 'Active in range', value: data.funnel.activeInRange },
              { label: 'LLM spend', value: `$${data.llm.totalCostUsd.toFixed(4)}`, sub: `${data.range.days}d` },
            ]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
            <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
              <BarChart
                label="Signups per day"
                data={data.signups.map((d) => ({ date: d.date, value: d.count }))}
              />
            </div>
            <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
              <LineChart
                label="Active users per day"
                data={data.activeUsers.map((d) => ({ date: d.date, value: d.count }))}
              />
            </div>
          </div>

          <section style={{ marginTop: 24, border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Funnel</h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
              <span>Clients <strong>{data.funnel.clients}</strong></span>
              <span>→</span>
              <span>Intakes <strong>{data.funnel.intakes}</strong></span>
              <span>→</span>
              <span>Plans <strong>{data.funnel.plans}</strong></span>
              <span>→</span>
              <span>Approved <strong>{data.funnel.approvedPlans}</strong></span>
              <span>→</span>
              <span>Active <strong>{data.funnel.activeInRange}</strong></span>
            </div>
          </section>

          <section style={{ marginTop: 24, border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Retention by program week (check-ins)</h2>
            <BarChart
              label=""
              data={data.retentionByWeek.map((r) => ({
                date: `W${r.week}`,
                value: r.clientsWithCheckIn,
              }))}
            />
          </section>

          <p style={{ marginTop: 24, fontSize: 13 }}>
            <Link href="/admin/costs">View full LLM cost breakdown →</Link>
          </p>
        </>
      )}
    </div>
  );
}

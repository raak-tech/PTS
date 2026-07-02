'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AdminNav } from '@/components/admin/AdminNav';
import { BarChart, LineChart, StatGrid } from '@/components/admin/AdminCharts';

type CostData = {
  range: { days: number };
  llm: {
    totalCostUsd: number;
    totalCalls: number;
    successCalls: number;
    errorCalls: number;
    totalTokens: number;
    costByDay: { date: string; costUsd: number }[];
    costByOperation: { operation: string; costUsd: number }[];
    costByModel: { model: string; costUsd: number }[];
    topClients: { userId: string; label: string; costUsd: number }[];
    recentCalls: {
      id: string;
      createdAt: string;
      operation: string;
      model: string;
      userId: string | null;
      weekNumber: number | null;
      costUsd: number | null;
      status: string;
      latencyMs: number | null;
    }[];
  };
};

export function AdminCostsClient() {
  const [data, setData] = useState<CostData | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    void fetch(`/api/admin/analytics?days=${days}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setData(d as CostData));
  }, [days]);

  const llm = data?.llm;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>
      <AdminNav current="/admin/costs" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>LLM costs</h1>
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

      {!llm ? (
        <p>Loading…</p>
      ) : (
        <>
          <StatGrid
            items={[
              { label: 'Total spend', value: `$${llm.totalCostUsd.toFixed(4)}` },
              { label: 'API calls', value: llm.totalCalls },
              { label: 'Success', value: llm.successCalls },
              { label: 'Errors', value: llm.errorCalls },
              { label: 'Tokens', value: llm.totalTokens.toLocaleString() },
            ]}
          />

          <div style={{ marginTop: 24, border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
            <LineChart
              label="Cost per day (USD)"
              data={llm.costByDay.map((d) => ({ date: d.date, value: d.costUsd }))}
              formatValue={(n) => `$${n.toFixed(4)}`}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
            <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>By operation</h2>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                {llm.costByOperation.map((r) => (
                  <li key={r.operation}>
                    {r.operation}: <strong>${r.costUsd.toFixed(4)}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>By model</h2>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                {llm.costByModel.map((r) => (
                  <li key={r.model}>
                    {r.model}: <strong>${r.costUsd.toFixed(4)}</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section style={{ marginTop: 24, border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Top clients by LLM cost</h2>
            {llm.topClients.length === 0 ? (
              <p style={{ margin: 0, color: '#666' }}>No usage recorded yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <tbody>
                  {llm.topClients.map((c) => (
                    <tr key={c.userId} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}>
                        <Link href={`/admin/clients/${c.userId}`}>{c.label}</Link>
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>${c.costUsd.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section style={{ marginTop: 24, border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Recent calls</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                    <th style={{ padding: 8 }}>When</th>
                    <th style={{ padding: 8 }}>Operation</th>
                    <th style={{ padding: 8 }}>Status</th>
                    <th style={{ padding: 8 }}>Cost</th>
                    <th style={{ padding: 8 }}>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {llm.recentCalls.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 8 }}>{new Date(r.createdAt).toLocaleString()}</td>
                      <td style={{ padding: 8 }}>
                        {r.operation}
                        {r.weekNumber ? ` W${r.weekNumber}` : ''}
                      </td>
                      <td style={{ padding: 8, color: r.status === 'error' ? '#b71c1c' : '#2e7d32' }}>
                        {r.status}
                      </td>
                      <td style={{ padding: 8 }}>{r.costUsd != null ? `$${r.costUsd.toFixed(4)}` : '—'}</td>
                      <td style={{ padding: 8 }}>{r.latencyMs != null ? `${r.latencyMs}ms` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

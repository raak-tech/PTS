'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AdminNav } from '@/components/admin/AdminNav';

const TABLES = [
  'users',
  'intakes',
  'plans',
  'plan_weeks',
  'messages',
  'support_artifacts',
  'daily_check_ins',
  'holistic_completions',
  'weekly_check_ins',
  'llm_usage',
  'audit_log',
] as const;

type ExplorerResponse = {
  table: string;
  pilotPiiVisible?: boolean;
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
};

export function AdminExplorerClient() {
  const [table, setTable] = useState<string>('users');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ExplorerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    void fetch(`/api/admin/explorer?table=${table}&page=${page}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setData(d as ExplorerResponse))
      .finally(() => setLoading(false));
  }, [table, page]);

  const columns =
    data && data.rows.length > 0 ? Object.keys(data.rows[0]!) : [];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', fontFamily: 'inherit' }}>
      <AdminNav current="/admin/explorer" />
      <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 800 }}>Data explorer</h1>
      <p style={{ color: '#666', fontSize: 14, marginTop: 0 }}>
        {data?.pilotPiiVisible
          ? 'Pilot mode: full phone numbers, emails, and message previews are visible.'
          : 'Read-only browse of whitelisted tables. PII is masked; sensitive columns are excluded.'}
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 14 }}>
          Table{' '}
          <select
            value={table}
            onChange={(e) => {
              setTable(e.target.value);
              setPage(1);
            }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', marginLeft: 8 }}
          >
            {TABLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {data ? (
          <span style={{ fontSize: 13, color: '#888' }}>
            {data.total} rows · page {data.page}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : !data || data.rows.length === 0 ? (
        <p style={{ color: '#666' }}>No rows in this table.</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 12, background: 'white' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd', background: '#fafafa' }}>
                {columns.map((col) => (
                  <th key={col} style={{ padding: '10px 8px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={String(row.id)} style={{ borderBottom: '1px solid #eee' }}>
                  {columns.map((col) => (
                    <td key={col} style={{ padding: '8px', verticalAlign: 'top', maxWidth: 240 }}>
                      {col === 'userId' || col === 'clientId' ? (
                        row[col] ? (
                          <Link href={`/admin/clients/${String(row[col])}`} style={{ fontSize: 12 }}>
                            {String(row[col]).slice(0, 8)}…
                          </Link>
                        ) : (
                          '—'
                        )
                      ) : (
                        <span style={{ wordBreak: 'break-word' }}>
                          {row[col] == null ? '—' : String(row[col])}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!data || page * data.pageSize >= data.total}
          onClick={() => setPage((p) => p + 1)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

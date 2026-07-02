'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AdminNav } from '@/components/admin/AdminNav';

type AuditRow = {
  id: string;
  createdAt: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: string | null;
};

type AuditResponse = {
  rows: AuditRow[];
  total: number;
  page: number;
  pageSize: number;
};

export function AdminAuditClient() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditResponse | null>(null);

  useEffect(() => {
    void fetch(`/api/admin/audit?page=${page}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setData(d as AuditResponse));
  }, [page]);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>
      <AdminNav current="/admin/audit" />
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>Audit log</h1>
      <p style={{ color: '#666', fontSize: 14, marginTop: 0 }}>
        Admin and counselor actions: plan approvals, week generation, user creation, notes.
      </p>

      {!data ? (
        <p>Loading…</p>
      ) : data.rows.length === 0 ? (
        <p style={{ color: '#666' }}>No audit events yet.</p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: '#888' }}>
            {data.total} events · page {data.page}
          </p>
          <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 12, background: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd', background: '#fafafa', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>When</th>
                  <th style={{ padding: 10 }}>Actor</th>
                  <th style={{ padding: 10 }}>Action</th>
                  <th style={{ padding: 10 }}>Target</th>
                  <th style={{ padding: 10 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10, whiteSpace: 'nowrap' }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: 10 }}>
                      <div>{r.actorRole}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{r.actorUserId.slice(0, 8)}…</div>
                    </td>
                    <td style={{ padding: 10, fontWeight: 600 }}>{r.action}</td>
                    <td style={{ padding: 10 }}>
                      {r.targetType}
                      {r.targetId ? (
                        <>
                          <br />
                          <span style={{ fontSize: 11, color: '#888' }}>{r.targetId.slice(0, 12)}…</span>
                        </>
                      ) : null}
                    </td>
                    <td style={{ padding: 10, fontSize: 12, color: '#555', maxWidth: 280, wordBreak: 'break-word' }}>
                      {r.metadata ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd' }}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page * (data.pageSize ?? 50) >= data.total}
              onClick={() => setPage((p) => p + 1)}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd' }}
            >
              Next
            </button>
          </div>
        </>
      )}

      <p style={{ marginTop: 24, fontSize: 13 }}>
        <Link href="/admin/explorer?table=audit_log">Browse raw audit_log table →</Link>
      </p>
    </div>
  );
}

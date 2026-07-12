'use client';

import Link from 'next/link';
import { useState } from 'react';

export type PendingFormulationRow = {
  userId: string;
  email: string;
  status: string;
  version: number;
  safetyFlag: boolean;
  createdAt: string;
};

export function PendingFormulationsClient({ rows }: { rows: PendingFormulationRow[] }) {
  const [busy, setBusy] = useState<string | null>(null);

  if (rows.length === 0) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
        Awaiting formulation review ({rows.length})
      </h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
        Pain Script cohort (B) — approve formulation before generating Week 1.
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((row) => (
          <div
            key={row.userId}
            style={{
              padding: 16,
              border: '1px solid #f48fb1',
              borderRadius: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              background: '#fff8fb',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{row.email}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                v{row.version} · {row.status}
                {row.safetyFlag ? ' · ⚠️ Safety flag' : ''}
              </div>
            </div>
            <Link
              href={`/provider/formulations/${row.userId}`}
              style={{
                padding: '8px 14px',
                background: '#880e4f',
                color: '#fff',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
              }}
              onClick={() => setBusy(row.userId)}
            >
              {busy === row.userId ? 'Opening…' : 'Review formulation'}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';

export type PendingFormulationRow = {
  userId: string;
  email: string;
  status: string;
  version: number;
  safetyFlag: boolean;
  source: string;
  createdAt: string;
};

export function PendingFormulationsClient({ rows }: { rows: PendingFormulationRow[] }) {
  const [busy, setBusy] = useState<string | null>(null);

  const rescoreRows = rows.filter((r) => r.source === 'rescore');
  const intakeRows = rows.filter((r) => r.source !== 'rescore');

  const renderRow = (row: PendingFormulationRow) => (
    <div
      key={row.userId}
      style={{
        padding: 16,
        border: row.source === 'rescore' ? '1px solid #ffe082' : '1px solid #f48fb1',
        borderRadius: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        background: row.source === 'rescore' ? '#fffde7' : '#fff8fb',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{row.email}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          v{row.version} · {row.status}
          {row.source === 'rescore' ? ' · Weekly rescore' : ' · Initial intake'}
          {row.safetyFlag ? ' · ⚠️ Safety flag' : ''}
        </div>
      </div>
      <Link
        href={`/provider/formulations/${row.userId}`}
        style={{
          padding: '8px 14px',
          background: row.source === 'rescore' ? '#f57c00' : '#880e4f',
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
  );

  if (rows.length === 0) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      {intakeRows.length > 0 ? (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            Awaiting formulation review ({intakeRows.length})
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            Pain Script cohort (B) — approve formulation before generating Week 1.
          </p>
          <div style={{ display: 'grid', gap: 8, marginBottom: rescoreRows.length ? 24 : 0 }}>
            {intakeRows.map(renderRow)}
          </div>
        </>
      ) : null}
      {rescoreRows.length > 0 ? (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            Weekly rescore review ({rescoreRows.length})
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            Material change detected from check-in data — review deltas before approving an updated formulation.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>{rescoreRows.map(renderRow)}</div>
        </>
      ) : null}
    </section>
  );
}

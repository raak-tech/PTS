'use client';

import type { FormulationRescoreResult } from '@/lib/pain-script/formulation-rescore';
import type { StoredFormulation } from '@/lib/pain-script/formulation-store';

const directionStyle: Record<string, { bg: string; color: string }> = {
  improving: { bg: '#e8f5e9', color: '#2e7d32' },
  unchanged: { bg: '#f5f5f5', color: '#666' },
  worsening: { bg: '#ffebee', color: '#c62828' },
};

export function RescoreReviewPanel({
  rescore,
  approvedVersion,
}: {
  rescore: FormulationRescoreResult & { gateReasons?: string[] };
  approvedVersion?: number | null;
}) {
  return (
    <section
      style={{
        marginBottom: 24,
        padding: 16,
        background: '#fff8e1',
        border: '2px solid #ffe082',
        borderRadius: 12,
      }}
    >
      <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Weekly rescore (Stage 3)</h2>
      <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px', lineHeight: 1.5 }}>
        The system detected material change from this week&apos;s check-in data.
        {approvedVersion ? ` Compare with approved v${approvedVersion} below.` : ''}
        {' '}Approve if you agree the formulation should be updated for future weeks.
      </p>
      {rescore.note ? (
        <p style={{ fontSize: 14, margin: '0 0 12px', fontStyle: 'italic' }}>
          <strong>Counselor note:</strong> {rescore.note}
        </p>
      ) : null}
      {rescore.gateReasons?.length ? (
        <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>
          Triggered by: {rescore.gateReasons.join(', ')}
        </p>
      ) : null}

      {rescore.targetDeltas?.length ? (
        <>
          <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>Target deltas</h3>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {rescore.targetDeltas.map((d) => {
              const style = directionStyle[d.direction] ?? directionStyle.unchanged;
              return (
                <div
                  key={d.tag}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: style.bg,
                    fontSize: 13,
                  }}
                >
                  <strong style={{ color: style.color }}>{d.tag}</strong>
                  <span style={{ marginLeft: 8, fontWeight: 600, color: style.color }}>{d.direction}</span>
                  <p style={{ margin: '4px 0 0', color: '#333', lineHeight: 1.4 }}>{d.evidence}</p>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {rescore.newSignals?.length ? (
        <>
          <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>New signals</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
            {rescore.newSignals.map((s, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                <strong>{s.component}:</strong> {s.item}
                {s.tags?.length ? ` (${s.tags.join(', ')})` : ''}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

export function ApprovedFormulationSnapshot({ approved }: { approved: StoredFormulation }) {
  return (
    <details style={{ marginBottom: 20, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
        Currently approved formulation (v{approved.version})
      </summary>
      <p style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
        {approved.formulation.maintenanceHypothesis}
      </p>
      <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0' }}>
        Targets: {approved.formulation.primaryTargets.join(', ')}
      </p>
    </details>
  );
}

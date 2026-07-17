'use client';

type IntakeContextRailProps = {
  painSource?: string | null;
  painDescription?: string | null;
  recoveryGoal?: string | null;
  biggestChange?: string | null;
  onsetType?: string | null;
  hasRedFlags?: boolean;
  isSafe?: boolean;
  completedAt?: string | null;
};

/**
 * Layer-1 client story — always visible on the Client Chart (every mode).
 */
export function IntakeContextRail({
  painSource,
  painDescription,
  recoveryGoal,
  biggestChange,
  onsetType,
  hasRedFlags,
  isSafe = true,
  completedAt,
}: IntakeContextRailProps) {
  const hasStory = Boolean(
    painSource?.trim() || painDescription?.trim() || recoveryGoal?.trim(),
  );

  if (!hasStory) {
    return (
      <section
        className="provider-panel"
        style={{ marginBottom: 20, borderColor: 'var(--border)' }}
        aria-label="Client story"
      >
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Client story</p>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>
          No intake on file yet for this client.
        </p>
      </section>
    );
  }

  return (
    <section
      className="provider-panel"
      style={{ marginBottom: 20 }}
      aria-label="Client story"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Client story</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hasRedFlags || isSafe === false ? (
            <span className="provider-tag provider-tag--danger">Safety flag</span>
          ) : null}
          {completedAt ? (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Submitted {new Date(completedAt).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      </div>
      <dl
        style={{
          margin: '12px 0 0',
          display: 'grid',
          gap: 10,
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--foreground)',
        }}
      >
        {painSource?.trim() ? (
          <div>
            <dt style={{ fontWeight: 600, fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>What happened</dt>
            <dd style={{ margin: 0 }}>{painSource}</dd>
          </div>
        ) : null}
        {painDescription?.trim() ? (
          <div>
            <dt style={{ fontWeight: 600, fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Situation</dt>
            <dd style={{ margin: 0 }}>{painDescription}</dd>
          </div>
        ) : null}
        {biggestChange?.trim() ? (
          <div>
            <dt style={{ fontWeight: 600, fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>What&apos;s changed most</dt>
            <dd style={{ margin: 0 }}>{biggestChange}</dd>
          </div>
        ) : null}
        {recoveryGoal?.trim() ? (
          <div>
            <dt style={{ fontWeight: 600, fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Goal</dt>
            <dd style={{ margin: 0 }}>{recoveryGoal}</dd>
          </div>
        ) : null}
        {onsetType?.trim() ? (
          <div>
            <dt style={{ fontWeight: 600, fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>How it started</dt>
            <dd style={{ margin: 0 }}>{onsetType}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

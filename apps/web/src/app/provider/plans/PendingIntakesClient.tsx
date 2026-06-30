'use client';

import Link from 'next/link';
import { useState } from 'react';

interface PendingIntake {
  userId: string;
  painSource: string;
  hasRedFlags: boolean;
  isSafe: boolean;
  createdAt: Date;
  email: string;
}

interface PendingIntakesClientProps {
  intakes: PendingIntake[];
  onIntakeGenerated: (userId: string) => void;
}

function anon(email: string) {
  const [local] = email.split('@');
  return `${local[0]}***@${email.split('@')[1]}`;
}

export function PendingIntakesClient({ intakes, onIntakeGenerated }: PendingIntakesClientProps) {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGeneratePlan = async (userId: string) => {
    setGenerating(userId);
    try {
      const res = await fetch('/api/provider/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = (await res.json()) as { ok?: boolean; reason?: string; planId?: string };

      if (!data.ok) {
        alert(`Failed: ${data.reason || 'Unknown error'}`);
        return;
      }

      onIntakeGenerated(userId);
      alert('Plan draft generated! Refreshing...');
      window.location.reload();
    } catch (err) {
      console.error('Generate plan error:', err);
      alert('Error generating plan');
    } finally {
      setGenerating(null);
    }
  };

  if (intakes.length === 0) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Pending intakes ({intakes.length})</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {intakes.map(intake => (
          <div
            key={intake.userId}
            style={{
              padding: '16px',
              border: '1px solid var(--border)',
              borderRadius: 12,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {anon(intake.email)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                {intake.painSource}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{intake.createdAt.toLocaleDateString()}</span>
                {(!intake.isSafe || intake.hasRedFlags) && (
                  <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: '#fee2e2', color: '#991b1b', fontSize: 11, fontWeight: 600 }}>
                    ⚠️ Red flag
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/messages?with=${intake.userId}`} className="actionLink secondary" style={{ fontSize: 13 }}>
                Message
              </Link>
              <button
                onClick={() => void handleGeneratePlan(intake.userId)}
                disabled={generating === intake.userId}
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: generating === intake.userId ? 'var(--muted)' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: generating === intake.userId ? 'default' : 'pointer',
                  opacity: generating === intake.userId ? 0.6 : 1,
                }}
              >
                {generating === intake.userId ? 'Generating...' : 'Generate plan'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

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
}

type RowState =
  | { status: 'idle' }
  | { status: 'generating' }
  | { status: 'done' }
  | { status: 'error'; message: string };

// Client-side cap slightly above the 300s serverless function limit.
const GENERATE_TIMEOUT_MS = 320_000;

export function PendingIntakesClient({ intakes }: PendingIntakesClientProps) {
  const [states, setStates] = useState<Record<string, RowState>>({});
  const [elapsed, setElapsed] = useState<Record<string, number>>({});

  const generatingId = Object.keys(states).find((id) => states[id]?.status === 'generating') ?? null;

  // Tick once a second while a generation is in flight (for the elapsed hint).
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (generatingId && !tickRef.current) {
      tickRef.current = setInterval(() => {
        setElapsed((prev) => ({ ...prev, [generatingId]: (prev[generatingId] ?? 0) + 1 }));
      }, 1000);
    } else if (!generatingId && tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [generatingId]);

  const setRow = (userId: string, state: RowState) =>
    setStates((prev) => ({ ...prev, [userId]: state }));

  const handleGeneratePlan = async (userId: string) => {
    setElapsed((prev) => ({ ...prev, [userId]: 0 }));
    setRow(userId, { status: 'generating' });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    try {
      const res = await fetch('/api/provider/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
        signal: controller.signal,
      });

      const data = (await res.json()) as { ok?: boolean; reason?: string; planId?: string };

      if (!res.ok || !data.ok) {
        // A draft that already exists is not a failure — it's ready to review below.
        if (data.reason === 'plan_exists') {
          setRow(userId, { status: 'done' });
          window.location.reload();
          return;
        }
        const message =
          data.reason === 'generation_failed'
            ? 'Generation failed — confirm intake is complete, then retry.'
            : data.reason ?? 'Could not generate Week 1.';
        setRow(userId, { status: 'error', message });
        return;
      }

      setRow(userId, { status: 'done' });
      window.location.reload();
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      setRow(userId, {
        status: 'error',
        message: aborted
          ? 'Timed out after 5 min. The draft may still finish — refresh in a moment to check.'
          : 'Network error — Week 1 not generated.',
      });
    } finally {
      clearTimeout(timer);
    }
  };

  if (intakes.length === 0) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Pending intakes ({intakes.length})</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
        AI generates a Week 1 draft (~2–4 min). Keep this tab open — you review and approve Week 1 before the client
        starts. Generating claims the client to you.
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {intakes.map(intake => {
          const state = states[intake.userId] ?? { status: 'idle' };
          const isGenerating = state.status === 'generating';
          const elapsedSec = elapsed[intake.userId] ?? 0;
          return (
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
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {intake.email}
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
                {isGenerating ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                    Building Week 1 program… {elapsedSec}s elapsed (usually 2–4 min). Please keep this tab open.
                  </div>
                ) : null}
                {state.status === 'error' ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#991b1b' }}>{state.message}</div>
                ) : null}
                {state.status === 'done' ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#166534' }}>Draft ready — refreshing…</div>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/messages?with=${intake.userId}`} className="actionLink secondary" style={{ fontSize: 13 }}>
                  Message
                </Link>
                <button
                  onClick={() => void handleGeneratePlan(intake.userId)}
                  disabled={isGenerating}
                  style={{
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: isGenerating ? 'var(--muted)' : 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: isGenerating ? 'default' : 'pointer',
                    opacity: isGenerating ? 0.6 : 1,
                  }}
                >
                  {isGenerating
                    ? 'Generating Week 1…'
                    : state.status === 'error'
                      ? 'Retry Week 1 draft'
                      : 'Generate Week 1 draft'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

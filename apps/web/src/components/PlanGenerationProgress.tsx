'use client';

import { useEffect, useState } from 'react';

import {
  formatGenerationElapsed,
  PLAN_GENERATION_HINT,
  PLAN_GENERATION_STEPS,
  stepIndexForElapsed,
} from '@/lib/plan-generation-progress';

export function PlanGenerationProgress({ active }: { active: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [active]);

  if (!active) return null;

  const stepIndex = stepIndexForElapsed(elapsed);
  const progress = Math.min(95, 12 + stepIndex * 18 + (elapsed % 35));

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(17, 17, 17, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 18,
          padding: '24px 22px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 17, color: '#111' }}>
          Generating plan draft
        </p>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#555', lineHeight: 1.5 }}>
          {PLAN_GENERATION_HINT}
        </p>

        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: '#eee',
            overflow: 'hidden',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #111 0%, #444 100%)',
              transition: 'width 1s ease',
            }}
          />
        </div>

        <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#111' }}>
          {PLAN_GENERATION_STEPS[stepIndex]}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
          Elapsed: {formatGenerationElapsed(elapsed)}
        </p>
      </div>
    </div>
  );
}

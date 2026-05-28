"use client";

import Link from 'next/link';
import { useState } from 'react';
import type { GeneratedPlan } from '../../../lib/plan-generator';

type IntakeSummary = { painSource: string; painDescription: string; recoveryGoal: string } | null;

export function PlanReviewClient({
  planId,
  clientEmail,
  clientId,
  intake,
  plan,
  createdAt,
}: {
  planId: string;
  clientEmail: string;
  clientId: string;
  intake: IntakeSummary;
  plan: GeneratedPlan;
  createdAt: string;
}) {
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'approved'>('idle');

  const approve = async () => {
    setStatus('saving');
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, counselorNotes: notes, action: 'approve' }),
    });
    if (res.ok) setStatus('approved');
    else setStatus('idle');
  };

  if (status === 'approved') {
    return (
      <div style={{ padding: '20px 24px', border: '1px solid #c8e6c9', borderRadius: 16, background: '#f1f8e9', marginBottom: 16 }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#2e7d32' }}>✓ Plan approved for {clientEmail}</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>The client will see their plan the next time they visit.</p>
        <Link href={`/messages?with=${clientId}`} style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: '#333', textDecoration: 'underline' }}>
          Message this client →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 18, marginBottom: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>{clientEmail}</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>Generated {createdAt} · awaiting review</p>
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 999, border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}>
          {expanded ? 'Collapse' : 'Review plan'}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '20px 24px' }}>
          {/* Client context */}
          {intake && (
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13 }}>Client context</p>
              <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Cause:</strong> {intake.painSource}</p>
              <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Situation:</strong> {intake.painDescription}</p>
              <p style={{ margin: 0, fontSize: 13 }}><strong>Goal:</strong> {intake.recoveryGoal}</p>
            </div>
          )}

          {/* LLM summary for counselor */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Counselor summary</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#333' }}>{plan.clientSummary}</p>
          </div>

          {/* Key themes + watch points */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13 }}>Key themes</p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {plan.keyThemes.map(t => <li key={t} style={{ fontSize: 13, marginBottom: 4 }}>{t}</li>)}
              </ul>
            </div>
            <div style={{ background: '#fff3e0', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13 }}>Watch points</p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {plan.watchPoints.map(w => <li key={w} style={{ fontSize: 13, marginBottom: 4 }}>{w}</li>)}
              </ul>
            </div>
          </div>

          {/* Client overview */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600 }}>What the client will see</p>
            <p style={{ margin: 0, fontSize: 14, color: '#555', fontStyle: 'italic', lineHeight: 1.6 }}>"{plan.overview}"</p>
          </div>

          {/* Weeks */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>6-week plan</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {plan.weeks.map(w => (
                <details key={w.week} style={{ border: '1px solid #eee', borderRadius: 10, padding: '12px 16px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                    Week {w.week} — {w.theme}
                  </summary>
                  <div style={{ marginTop: 12 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>{w.focus}</p>
                    <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13 }}>Daily practices</p>
                    {w.dailyPractices.map(p => (
                      <div key={p.title} style={{ marginBottom: 8 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 500 }}>{p.title} <span style={{ color: '#888', fontWeight: 400 }}>({p.duration})</span></p>
                        <p style={{ margin: 0, fontSize: 13, color: '#555' }}>{p.description}</p>
                      </div>
                    ))}
                    <p style={{ margin: '10px 0 2px', fontWeight: 600, fontSize: 13 }}>Weekly reflection</p>
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555', fontStyle: 'italic' }}>"{w.weeklyReflection}"</p>
                    <p style={{ margin: '8px 0 2px', fontWeight: 600, fontSize: 13, color: '#e65100' }}>Counselor note</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#e65100' }}>{w.counselorNote}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Counselor notes + approve */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
              Counselor notes <span style={{ fontWeight: 400, color: '#888' }}>(optional — visible to you only)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything to remember about this client or adjustments for the live program…"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => void approve()}
                disabled={status === 'saving'}
                style={{ padding: '10px 24px', borderRadius: 999, border: 'none', background: '#111', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                {status === 'saving' ? 'Approving…' : 'Approve & send to client'}
              </button>
              <Link href={`/messages?with=${clientId}`} style={{ padding: '10px 20px', borderRadius: 999, border: '1px solid #ddd', color: '#333', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center' }}>
                Message client
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

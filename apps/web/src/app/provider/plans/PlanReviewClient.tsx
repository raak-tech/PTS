"use client";

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import type { GeneratedPlan, WeekPlan } from '@/lib/plan-generator';
import { PlanGenerationProgress } from '@/components/PlanGenerationProgress';
import {
  applyHolisticVisibility,
  DEFAULT_HOLISTIC_VISIBILITY,
  type HolisticVisibility,
} from '@/lib/plan-holistic-edits';
import { WeekEditor, btnSecondary } from '@/components/provider/WeekEditor';

type IntakeSummary = { painSource: string; painDescription: string; recoveryGoal: string } | null;

const PROGRAM_WEEKS = 6;

const lockedCard: CSSProperties = {
  border: '1px dashed #d0d0d0',
  borderRadius: 12,
  marginBottom: 10,
  padding: '14px 16px',
  background: '#fafafa',
};

function LockedWeekCard({ weekNumber, clientId }: { weekNumber: number; clientId: string }) {
  return (
    <div style={lockedCard}>
      <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#666' }}>
        Week {weekNumber} — Not generated yet
      </p>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#888', lineHeight: 1.5 }}>
        Approve Week {weekNumber - 1} first, then generate Week {weekNumber} from the client workspace after saving your week comment.
      </p>
      <Link
        href={`/provider/clients/${clientId}?tab=plan`}
        style={{ fontSize: 13, color: '#333', textDecoration: 'underline', fontWeight: 600 }}
      >
        Open client workspace →
      </Link>
    </div>
  );
}

export function PlanReviewClient({
  planId,
  clientEmail,
  clientId,
  intake,
  plan,
  createdAt,
  initialWeekStatuses = {},
  pendingWeeksLabel,
  hasCrisisNotes = false,
  initialExpanded = false,
}: {
  planId: string;
  clientEmail: string;
  clientId: string;
  intake: IntakeSummary;
  plan: GeneratedPlan;
  createdAt: string;
  initialWeekStatuses?: Record<number, 'draft' | 'edited' | 'approved'>;
  pendingWeeksLabel?: string;
  hasCrisisNotes?: boolean;
  initialExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [crisisAcknowledged, setCrisisAcknowledged] = useState(false);
  const [regenStatus, setRegenStatus] = useState<'idle' | 'generating'>('idle');
  const [holisticVisibility, setHolisticVisibility] = useState<HolisticVisibility>(DEFAULT_HOLISTIC_VISIBILITY);
  const [weekStatuses, setWeekStatuses] = useState<Record<number, 'draft' | 'edited' | 'approved'>>(initialWeekStatuses);
  const [weekData, setWeekData] = useState<Record<number, WeekPlan>>(
    Object.fromEntries(plan.weeks.map(w => [w.week, w]))
  );

  const approvedCount = Object.values(weekStatuses).filter(s => s === 'approved').length;
  const generatedWeekNumbers = new Set(plan.weeks.map(w => w.week));
  const lockedWeekNumbers = Array.from({ length: PROGRAM_WEEKS }, (_, i) => i + 1).filter(
    n => !generatedWeekNumbers.has(n),
  );

  const regenerate = async () => {
    setRegenStatus('generating');
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId, action: 'regenerate' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.detail ?? data.error ?? 'Plan regeneration failed. Try again in a minute.');
        setRegenStatus('idle');
        return;
      }
      window.location.reload();
    } catch {
      setRegenStatus('idle');
    }
  };

  const toggleHolistic = (key: keyof HolisticVisibility) => {
    setHolisticVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleWeekSaved = (updated: WeekPlan, status: 'edited') => {
    setWeekData(prev => ({ ...prev, [updated.week]: updated }));
    setWeekStatuses(prev => ({ ...prev, [updated.week]: status }));
  };

  const handleWeekApproved = (weekNumber: number) => {
    setWeekStatuses(prev => ({ ...prev, [weekNumber]: 'approved' }));
  };

  const previewPlan = applyHolisticVisibility(
    { ...plan, weeks: plan.weeks.map(w => weekData[w.week] ?? w) },
    holisticVisibility
  );

  return (
    <>
      <PlanGenerationProgress active={regenStatus === 'generating'} />
      <div style={{ border: '1px solid var(--border)', borderRadius: 18, marginBottom: 16, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--foreground)' }}>{clientEmail}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
              {pendingWeeksLabel ?? `Week 1 draft`} · Generated {createdAt} · {approvedCount}/{PROGRAM_WEEKS} weeks approved
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setExpanded(e => !e)} style={btnSecondary}>
              {expanded ? 'Collapse' : 'Review & edit plan'}
            </button>
            <Link
              href={`/provider/clients/${clientId}?tab=plan`}
              style={{ ...btnSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Open in workspace →
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        {expanded && (
          <div style={{ height: 4, background: '#f0f0f0' }}>
            <div style={{ height: '100%', background: '#2e7d32', width: `${(approvedCount / PROGRAM_WEEKS) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        )}

        {expanded && (
          <div style={{ padding: '20px 24px', background: '#fffcf7', color: '#1a1a1a' }}>

            {/* Client context */}
            {intake && (
              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#1a1a1a' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13 }}>Client context</p>
                <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Cause:</strong> {intake.painSource}</p>
                <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Situation:</strong> {intake.painDescription}</p>
                <p style={{ margin: 0, fontSize: 13 }}><strong>Goal:</strong> {intake.recoveryGoal}</p>
              </div>
            )}

            {/* Pain-script client intro (cohort B) */}
            {plan.formulationSummary ? (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: '#e8f5e9', borderRadius: 10, border: '1px solid #c8e6c9', color: '#1a1a1a' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13 }}>What we&apos;re working on together (client-facing)</p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#333' }}>{plan.formulationSummary}</p>
              </div>
            ) : null}

            {/* LLM counselor summary */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#1a1a1a' }}>Counselor summary</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#333' }}>{plan.clientSummary}</p>
            </div>

            {/* Key themes + watch points */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '12px 16px', color: '#1a1a1a' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>Key themes</p>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#333' }}>
                  {plan.keyThemes.map(t => <li key={t} style={{ fontSize: 13, marginBottom: 4 }}>{t}</li>)}
                </ul>
              </div>
              <div style={{ background: '#fff3e0', borderRadius: 10, padding: '12px 16px', color: '#1a1a1a' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>Watch points</p>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#333' }}>
                  {plan.watchPoints.map(w => <li key={w} style={{ fontSize: 13, marginBottom: 4 }}>{w}</li>)}
                </ul>
              </div>
            </div>

            {/* Protected formulation — counselor only */}
            {plan.protectedFormulation && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: '#fce4ec', border: '2px solid #f48fb1', borderRadius: 10 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: '#880e4f' }}>
                  Protected formulation — confidential IP
                </p>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#ad1457', lineHeight: 1.5 }}>
                  {plan.protectedFormulation.confidentiality}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6 }}>
                  <strong>Maintenance hypothesis:</strong> {plan.protectedFormulation.scriptMaintenanceHypothesis}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6 }}>
                  <strong>Week 1 leverage:</strong> {plan.protectedFormulation.week1TherapeuticLeverage}
                </p>
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13 }}>BASIC I.D. snapshot</p>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.5 }}>
                  {Object.entries(plan.protectedFormulation.basicIdSnapshot)
                    .filter(([, v]) => v)
                    .map(([key, value]) => (
                      <li key={key} style={{ marginBottom: 4 }}>
                        <strong>{key}:</strong> {value}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Client overview */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600 }}>What the client will see</p>
              <p style={{ margin: 0, fontSize: 14, color: '#555', fontStyle: 'italic', lineHeight: 1.6 }}>&ldquo;{plan.overview}&rdquo;</p>
            </div>

            {/* Holistic visibility toggles */}
            <div style={{ marginBottom: 20, padding: '14px 16px', background: '#f8f9fa', borderRadius: 10, border: '1px solid #e8e8e8', color: '#1a1a1a' }}>
              <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>Holistic blocks</p>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555' }}>Uncheck to remove a block from all weeks before the client sees them.</p>
              {(['ayurveda', 'yoga', 'music'] as const).map(key => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 14, cursor: 'pointer', color: '#1a1a1a' }}>
                  <input type="checkbox" checked={holisticVisibility[key]} onChange={() => toggleHolistic(key)} />
                  {key === 'ayurveda' ? 'Include Ayurveda diet & rhythm' : key === 'yoga' ? 'Include breath, meditation & reflection' : 'Include music moment'}
                </label>
              ))}
            </div>

            {/* Crisis acknowledgment gate */}
            {hasCrisisNotes && (
              <div style={{ marginBottom: 20, padding: '16px', background: '#ffebee', border: '2px solid #ef9a9a', borderRadius: 12 }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#b71c1c', fontSize: 15 }}>
                  🚨 This plan has crisis-level notes
                </p>
                <p style={{ margin: '0 0 12px', fontSize: 14, color: '#c62828', lineHeight: 1.6 }}>
                  This client reported red flags or a safety concern in their intake. Read the notes carefully before approving any week.
                </p>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 14, color: '#b71c1c', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={crisisAcknowledged}
                    onChange={e => setCrisisAcknowledged(e.target.checked)}
                    style={{ marginTop: 2, width: 18, height: 18, cursor: 'pointer', accentColor: '#b71c1c' }}
                  />
                  I have read the crisis notes and am proceeding with full awareness of this client&rsquo;s safety status.
                </label>
              </div>
            )}

            {/* Per-week editors */}
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
              Week 1 draft — click any field to edit
              <span style={{ fontSize: 13, fontWeight: 400, color: '#888', marginLeft: 8 }}>Changes save automatically</span>
            </p>
            {previewPlan.weeks.map(w => (
              <WeekEditor
                key={w.week}
                week={w}
                planId={planId}
                weekStatus={weekStatuses[w.week] ?? 'draft'}
                crisisBlocked={hasCrisisNotes && !crisisAcknowledged}
                onSaved={handleWeekSaved}
                onApproved={handleWeekApproved}
              />
            ))}
            {lockedWeekNumbers.map(weekNumber => (
              <LockedWeekCard key={weekNumber} weekNumber={weekNumber} clientId={clientId} />
            ))}

            <div style={{ borderTop: '1px solid #eee', paddingTop: 20, marginTop: 20 }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555' }}>
                Approve Week 1 above to release it to the client. Later weeks are generated from the{' '}
                <Link href={`/provider/clients/${clientId}?tab=plan`} style={{ color: '#333' }}>
                  client workspace
                </Link>
                .
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => void regenerate()}
                  disabled={regenStatus === 'generating'}
                  style={{ ...btnSecondary, opacity: regenStatus === 'generating' ? 0.7 : 1 }}
                >
                  {regenStatus === 'generating' ? 'Regenerating…' : 'Regenerate Week 1 draft'}
                </button>
                <Link
                  href={`/messages?with=${clientId}`}
                  style={{ ...btnSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Message client
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

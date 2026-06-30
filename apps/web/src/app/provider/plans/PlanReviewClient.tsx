"use client";

import Link from 'next/link';
import { useCallback, useState, type CSSProperties } from 'react';
import type { GeneratedPlan, WeekPlan } from '../../../lib/plan-generator';
import { PlanGenerationProgress } from '@/components/PlanGenerationProgress';
import {
  applyHolisticVisibility,
  DEFAULT_HOLISTIC_VISIBILITY,
  type HolisticVisibility,
} from '@/lib/plan-holistic-edits';

type IntakeSummary = { painSource: string; painDescription: string; recoveryGoal: string } | null;

const btnSecondary: CSSProperties = {
  fontSize: 14,
  padding: '10px 18px',
  borderRadius: 999,
  border: '1.5px solid #c8c8c8',
  background: '#ffffff',
  color: '#111111',
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: 44,
};

const btnPrimary: CSSProperties = {
  padding: '12px 24px',
  borderRadius: 999,
  border: 'none',
  background: '#111111',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  minHeight: 44,
};

const btnApprove: CSSProperties = {
  padding: '10px 20px',
  borderRadius: 999,
  border: 'none',
  background: '#2e7d32',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  minHeight: 44,
};

// Inline editable text field — click to edit, blur to save
function EditableField({
  label,
  value,
  multiline = false,
  onSave,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing) {
    return (
      <div style={{ marginBottom: 8 }}>
        <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
        {multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            rows={3}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #fbbf24', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === 'Enter' && commit()}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #fbbf24', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        )}
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888' }}>Click away or press Enter to save</p>
      </div>
    );
  }

  return (
    <div
      style={{ marginBottom: 8, padding: '6px 8px', borderRadius: 6, cursor: 'text', border: '1px dashed transparent' }}
      title="Click to edit"
      onClick={() => { setDraft(value); setEditing(true); }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
    >
      <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label} ✎</p>
      <p style={{ margin: 0, fontSize: 13, color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{value || <em style={{ color: '#bbb' }}>empty</em>}</p>
    </div>
  );
}

// Editable week card — all fields inline editable
function WeekEditor({
  week,
  planId,
  weekStatus,
  onSaved,
  onApproved,
}: {
  week: WeekPlan;
  planId: string;
  weekStatus: 'draft' | 'edited' | 'approved';
  onSaved: (updated: WeekPlan, status: 'edited') => void;
  onApproved: (weekNumber: number) => void;
}) {
  const [data, setData] = useState<WeekPlan>(week);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [approveError, setApproveError] = useState('');
  const [localStatus, setLocalStatus] = useState(weekStatus);

  const saveWeek = useCallback(async (updated: WeekPlan) => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/provider/plans/${planId}/week/${updated.week}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: JSON.stringify(updated) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error ?? 'Save failed');
        return;
      }
      setLocalStatus('edited');
      onSaved(updated, 'edited');
    } catch {
      setSaveError('Network error — changes not saved');
    } finally {
      setSaving(false);
    }
  }, [planId, onSaved]);

  const updateField = <K extends keyof WeekPlan>(key: K, value: WeekPlan[K]) => {
    const updated = { ...data, [key]: value };
    setData(updated);
    void saveWeek(updated);
  };

  const updatePractice = (index: number, field: 'title' | 'description' | 'duration', value: string) => {
    const practices = data.dailyPractices.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    const updated = { ...data, dailyPractices: practices };
    setData(updated);
    void saveWeek(updated);
  };

  const approveWeek = async () => {
    setApproving(true);
    setApproveError('');
    try {
      const res = await fetch(`/api/provider/plans/${planId}/week/${data.week}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setApproveError(d.error ?? 'Approval failed');
        return;
      }
      setLocalStatus('approved');
      onApproved(data.week);
    } catch {
      setApproveError('Network error — approval not saved');
    } finally {
      setApproving(false);
    }
  };

  const statusBadge: Record<string, CSSProperties> = {
    draft:    { background: '#f5f5f5', color: '#888', border: '1px solid #e0e0e0' },
    edited:   { background: '#fff8e1', color: '#f57c00', border: '1px solid #ffe082' },
    approved: { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' },
  };

  const statusLabel = { draft: 'Draft', edited: 'Edited — not yet approved', approved: '✓ Approved' };

  return (
    <details style={{ border: '1px solid #e8e8e8', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
      <summary style={{ cursor: 'pointer', padding: '12px 16px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', listStyle: 'none', userSelect: 'none' }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Week {data.week} — {data.theme}</span>
        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, ...statusBadge[localStatus] }}>
          {statusLabel[localStatus]}
        </span>
      </summary>

      <div style={{ padding: '16px 20px' }}>
        {saving && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888' }}>Saving…</p>}
        {saveError && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#c62828' }}>{saveError}</p>}

        <EditableField label="Week theme" value={data.theme} onSave={v => updateField('theme', v)} />
        <EditableField label="Week focus" value={data.focus} multiline onSave={v => updateField('focus', v)} />
        <EditableField label="Weekly reflection prompt" value={data.weeklyReflection} multiline onSave={v => updateField('weeklyReflection', v)} />

        <p style={{ margin: '16px 0 8px', fontWeight: 600, fontSize: 13 }}>Daily practices</p>
        {data.dailyPractices.map((p, i) => (
          <div key={i} style={{ marginBottom: 12, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
            <EditableField label={`Practice ${i + 1} title`} value={p.title} onSave={v => updatePractice(i, 'title', v)} />
            <EditableField label="Description" value={p.description} multiline onSave={v => updatePractice(i, 'description', v)} />
            <EditableField label="Duration" value={p.duration} onSave={v => updatePractice(i, 'duration', v)} />
          </div>
        ))}

        {data.reinforcementTemplate && (
          <>
            <p style={{ margin: '16px 0 8px', fontWeight: 600, fontSize: 13 }}>Daily read-out</p>
            <div style={{ padding: '10px 12px', background: '#f3f8ff', borderRadius: 8, border: '1px solid #cfe2ff', marginBottom: 8 }}>
              <EditableField label="Read-out title" value={data.reinforcementTemplate.title} onSave={v => updateField('reinforcementTemplate', { ...data.reinforcementTemplate!, title: v })} />
              <EditableField label="Read-out body" value={data.reinforcementTemplate.bodyText} multiline onSave={v => updateField('reinforcementTemplate', { ...data.reinforcementTemplate!, bodyText: v })} />
            </div>
          </>
        )}

        {data.ayurvedaBlock && (
          <>
            <p style={{ margin: '16px 0 8px', fontWeight: 600, fontSize: 13 }}>Ayurveda-informed wellness</p>
            <div style={{ padding: '10px 12px', background: '#f1f8e9', borderRadius: 8, border: '1px solid #c8e6c9', marginBottom: 8 }}>
              <EditableField label="Rhythm note" value={data.ayurvedaBlock.rhythmNote} multiline onSave={v => updateField('ayurvedaBlock', { ...data.ayurvedaBlock!, rhythmNote: v })} />
            </div>
          </>
        )}

        {data.yogaTrial && (
          <>
            <p style={{ margin: '16px 0 8px', fontWeight: 600, fontSize: 13 }}>Yoga principle trial</p>
            <div style={{ padding: '10px 12px', background: '#fff8e1', borderRadius: 8, border: '1px solid #ffe082', marginBottom: 8 }}>
              <EditableField label="Principle" value={data.yogaTrial.principle} onSave={v => updateField('yogaTrial', { ...data.yogaTrial!, principle: v })} />
              <EditableField label="Applicability" value={data.yogaTrial.applicability} multiline onSave={v => updateField('yogaTrial', { ...data.yogaTrial!, applicability: v })} />
              <EditableField label="Micro-movement title" value={data.yogaTrial.microMovement.title} onSave={v => updateField('yogaTrial', { ...data.yogaTrial!, microMovement: { ...data.yogaTrial!.microMovement, title: v } })} />
              <EditableField label="Micro-movement description" value={data.yogaTrial.microMovement.description} multiline onSave={v => updateField('yogaTrial', { ...data.yogaTrial!, microMovement: { ...data.yogaTrial!.microMovement, description: v } })} />
              <EditableField label="Duration" value={data.yogaTrial.microMovement.duration} onSave={v => updateField('yogaTrial', { ...data.yogaTrial!, microMovement: { ...data.yogaTrial!.microMovement, duration: v } })} />
            </div>
          </>
        )}

        {data.musicMoment && (
          <>
            <p style={{ margin: '16px 0 8px', fontWeight: 600, fontSize: 13 }}>Music moment</p>
            <div style={{ padding: '10px 12px', background: '#f3e5f5', borderRadius: 8, border: '1px solid #e1bee7', marginBottom: 8 }}>
              <EditableField label="Purpose" value={data.musicMoment.purpose} onSave={v => updateField('musicMoment', { ...data.musicMoment!, purpose: v })} />
              <EditableField label="Suggestion" value={data.musicMoment.suggestion} multiline onSave={v => updateField('musicMoment', { ...data.musicMoment!, suggestion: v })} />
            </div>
          </>
        )}

        {localStatus !== 'approved' && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => void approveWeek()}
              disabled={approving}
              style={{ ...btnApprove, opacity: approving ? 0.7 : 1 }}
            >
              {approving ? 'Approving…' : `Approve Week ${data.week}`}
            </button>
            <span style={{ fontSize: 13, color: '#888' }}>Client sees this week immediately on approval.</span>
            {approveError && <p style={{ margin: 0, fontSize: 13, color: '#c62828' }}>{approveError}</p>}
          </div>
        )}
      </div>
    </details>
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
}: {
  planId: string;
  clientEmail: string;
  clientId: string;
  intake: IntakeSummary;
  plan: GeneratedPlan;
  createdAt: string;
  initialWeekStatuses?: Record<number, 'draft' | 'edited' | 'approved'>;
}) {
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [planStatus, setPlanStatus] = useState<'idle' | 'saving' | 'approved'>('idle');
  const [regenStatus, setRegenStatus] = useState<'idle' | 'generating'>('idle');
  const [holisticVisibility, setHolisticVisibility] = useState<HolisticVisibility>(DEFAULT_HOLISTIC_VISIBILITY);
  const [weekStatuses, setWeekStatuses] = useState<Record<number, 'draft' | 'edited' | 'approved'>>(initialWeekStatuses);
  const [weekData, setWeekData] = useState<Record<number, WeekPlan>>(
    Object.fromEntries(plan.weeks.map(w => [w.week, w]))
  );

  const approvedCount = Object.values(weekStatuses).filter(s => s === 'approved').length;
  const totalWeeks = plan.weeks.length;

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

  // Legacy full-plan approve (all weeks at once) — kept for backward compatibility
  const approveAll = async () => {
    setPlanStatus('saving');
    const previewPlan = applyHolisticVisibility(plan, holisticVisibility);
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        planId,
        counselorNotes: notes,
        action: 'approve',
        holisticVisibility,
      }),
    });
    if (res.ok) {
      void previewPlan;
      setPlanStatus('approved');
    } else {
      setPlanStatus('idle');
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

  if (planStatus === 'approved') {
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
            <p style={{ margin: 0, fontWeight: 700, color: '#111' }}>{clientEmail}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#666' }}>
              Generated {createdAt} · {approvedCount}/{totalWeeks} weeks approved
            </p>
          </div>
          <button type="button" onClick={() => setExpanded(e => !e)} style={btnSecondary}>
            {expanded ? 'Collapse' : 'Review & edit plan'}
          </button>
        </div>

        {/* Progress bar */}
        {expanded && totalWeeks > 0 && (
          <div style={{ height: 4, background: '#f0f0f0' }}>
            <div style={{ height: '100%', background: '#2e7d32', width: `${(approvedCount / totalWeeks) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        )}

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

            {/* LLM counselor summary */}
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

            {/* Holistic visibility toggles */}
            <div style={{ marginBottom: 20, padding: '14px 16px', background: '#f8f9fa', borderRadius: 10, border: '1px solid #e8e8e8' }}>
              <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14 }}>Holistic blocks</p>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555' }}>Uncheck to remove a block from all weeks before the client sees them.</p>
              {(['ayurveda', 'yoga', 'music'] as const).map(key => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={holisticVisibility[key]} onChange={() => toggleHolistic(key)} />
                  {key === 'ayurveda' ? 'Include Ayurveda-informed wellness' : key === 'yoga' ? 'Include yoga principle trial' : 'Include music playlists'}
                </label>
              ))}
            </div>

            {/* Per-week editors */}
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
              6-week plan — click any field to edit
              <span style={{ fontSize: 13, fontWeight: 400, color: '#888', marginLeft: 8 }}>Changes save automatically</span>
            </p>
            {previewPlan.weeks.map(w => (
              <WeekEditor
                key={w.week}
                week={w}
                planId={planId}
                weekStatus={weekStatuses[w.week] ?? 'draft'}
                onSaved={handleWeekSaved}
                onApproved={handleWeekApproved}
              />
            ))}

            {/* Counselor notes + legacy full-approve */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: 20, marginTop: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                Counselor notes <span style={{ fontWeight: 400, color: '#888' }}>(optional — visible to you only)</span>
              </label>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555' }}>
                Or approve all weeks at once using the button below. Individual per-week approvals above are recommended.
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything to remember about this client…"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => void approveAll()}
                  disabled={planStatus === 'saving'}
                  style={{ ...btnPrimary, opacity: planStatus === 'saving' ? 0.7 : 1 }}
                >
                  {planStatus === 'saving' ? 'Approving…' : 'Approve all weeks & send to client'}
                </button>
                <button
                  type="button"
                  onClick={() => void regenerate()}
                  disabled={regenStatus === 'generating'}
                  style={{ ...btnSecondary, opacity: regenStatus === 'generating' ? 0.7 : 1 }}
                >
                  {regenStatus === 'generating' ? 'Regenerating…' : 'Regenerate plan draft'}
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

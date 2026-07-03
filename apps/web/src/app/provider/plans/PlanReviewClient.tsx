"use client";

import Link from 'next/link';
import { useCallback, useState, type CSSProperties } from 'react';
import type { GeneratedPlan, WeekPlan } from '../../../lib/plan-generator';
import {
  getWeekReinforcementTemplates,
  withWeekReinforcementTemplates,
  type ReinforcementTemplate,
} from '@/lib/reinforcement-templates';
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
  crisisBlocked,
  onSaved,
  onApproved,
}: {
  week: WeekPlan;
  planId: string;
  weekStatus: 'draft' | 'edited' | 'approved';
  crisisBlocked: boolean;
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

  const readOuts = getWeekReinforcementTemplates(data);

  const updateReadOut = (index: number, field: keyof ReinforcementTemplate, value: string) => {
    const next = readOuts.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    const updated = withWeekReinforcementTemplates(data, next);
    setData(updated);
    void saveWeek(updated);
  };

  const addReadOut = () => {
    const updated = withWeekReinforcementTemplates(data, [
      ...readOuts,
      { title: 'New read-out', bodyText: '' },
    ]);
    setData(updated);
    void saveWeek(updated);
  };

  const removeReadOut = (index: number) => {
    const updated = withWeekReinforcementTemplates(
      data,
      readOuts.filter((_, i) => i !== index),
    );
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
        <EditableField label="Counselor note (private)" value={data.counselorNote ?? ''} multiline onSave={v => updateField('counselorNote', v)} />

        <p style={{ margin: '16px 0 8px', fontWeight: 600, fontSize: 13 }}>Daily practices</p>
        {data.dailyPractices.map((p, i) => (
          <div key={i} style={{ marginBottom: 12, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
            <EditableField label={`Practice ${i + 1} title`} value={p.title} onSave={v => updatePractice(i, 'title', v)} />
            <EditableField label="Description" value={p.description} multiline onSave={v => updatePractice(i, 'description', v)} />
            <EditableField label="Duration" value={p.duration} onSave={v => updatePractice(i, 'duration', v)} />
            <button
              type="button"
              onClick={() => {
                const practices = data.dailyPractices.filter((_, idx) => idx !== i);
                const updated = { ...data, dailyPractices: practices };
                setData(updated);
                void saveWeek(updated);
              }}
              style={{ ...btnSecondary, fontSize: 12, padding: '6px 12px', marginTop: 4 }}
            >
              Remove practice
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const updated = {
              ...data,
              dailyPractices: [
                ...data.dailyPractices,
                { title: 'New practice', description: '', duration: '10 min' },
              ],
            };
            setData(updated);
            void saveWeek(updated);
          }}
          style={{ ...btnSecondary, marginBottom: 12 }}
        >
          + Add practice
        </button>

        <p style={{ margin: '16px 0 8px', fontWeight: 600, fontSize: 13 }}>
          Daily read-outs ({readOuts.length})
        </p>
        {readOuts.length === 0 ? (
          <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>No read-outs in this week yet.</p>
        ) : (
          readOuts.map((readOut, i) => (
            <div
              key={`readout-${i}`}
              style={{ padding: '10px 12px', background: '#f3f8ff', borderRadius: 8, border: '1px solid #cfe2ff', marginBottom: 8 }}
            >
              <EditableField label={`Read-out ${i + 1} title`} value={readOut.title} onSave={v => updateReadOut(i, 'title', v)} />
              <EditableField label="Read-out body" value={readOut.bodyText} multiline onSave={v => updateReadOut(i, 'bodyText', v)} />
              <button
                type="button"
                onClick={() => removeReadOut(i)}
                style={{ ...btnSecondary, fontSize: 12, padding: '6px 12px', marginTop: 4 }}
              >
                Remove read-out
              </button>
            </div>
          ))
        )}
        <button type="button" onClick={addReadOut} style={{ ...btnSecondary, marginBottom: 12 }}>
          + Add read-out
        </button>

        {data.ayurvedaBlock && (
          <>
            <p style={{ margin: '16px 0 8px', fontWeight: 600, fontSize: 13 }}>Ayurveda-informed wellness</p>
            <div style={{ padding: '10px 12px', background: '#f1f8e9', borderRadius: 8, border: '1px solid #c8e6c9', marginBottom: 8 }}>
              <EditableField label="Rhythm note" value={data.ayurvedaBlock.rhythmNote} multiline onSave={v => updateField('ayurvedaBlock', { ...data.ayurvedaBlock!, rhythmNote: v })} />
              <EditableField
                label="Practices (one per line)"
                value={(data.ayurvedaBlock.practices ?? []).join('\n')}
                multiline
                onSave={v =>
                  updateField('ayurvedaBlock', {
                    ...data.ayurvedaBlock!,
                    practices: v.split('\n').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
              <EditableField
                label="Disclaimer"
                value={data.ayurvedaBlock.disclaimer ?? ''}
                multiline
                onSave={v => updateField('ayurvedaBlock', { ...data.ayurvedaBlock!, disclaimer: v })}
              />
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
              <EditableField label="Disclaimer" value={data.yogaTrial.disclaimer ?? ''} multiline onSave={v => updateField('yogaTrial', { ...data.yogaTrial!, disclaimer: v })} />
            </div>
          </>
        )}

        {data.musicMoment && (
          <>
            <p style={{ margin: '16px 0 8px', fontWeight: 600, fontSize: 13 }}>Music moment</p>
            <div style={{ padding: '10px 12px', background: '#f3e5f5', borderRadius: 8, border: '1px solid #e1bee7', marginBottom: 8 }}>
              <EditableField label="Purpose" value={data.musicMoment.purpose} onSave={v => updateField('musicMoment', { ...data.musicMoment!, purpose: v })} />
              <EditableField label="Suggestion" value={data.musicMoment.suggestion} multiline onSave={v => updateField('musicMoment', { ...data.musicMoment!, suggestion: v })} />
              {data.musicMoment.playlist ? (
                <>
                  <EditableField
                    label="Playlist title"
                    value={data.musicMoment.playlist.title}
                    onSave={v =>
                      updateField('musicMoment', {
                        ...data.musicMoment!,
                        playlist: { ...data.musicMoment!.playlist, title: v },
                      })
                    }
                  />
                  <EditableField
                    label="Spotify search query"
                    value={data.musicMoment.playlist.spotifySearchQuery ?? ''}
                    onSave={v =>
                      updateField('musicMoment', {
                        ...data.musicMoment!,
                        playlist: { ...data.musicMoment!.playlist, spotifySearchQuery: v },
                      })
                    }
                  />
                  {data.musicMoment.playlist.tracks?.map((track, ti) => (
                    <div key={ti} style={{ marginTop: 8, padding: 8, background: '#faf5fc', borderRadius: 6 }}>
                      <EditableField
                        label={`Track ${ti + 1} title`}
                        value={track.title}
                        onSave={v => {
                          const tracks = [...data.musicMoment!.playlist.tracks];
                          tracks[ti] = { ...tracks[ti], title: v };
                          updateField('musicMoment', {
                            ...data.musicMoment!,
                            playlist: { ...data.musicMoment!.playlist, tracks },
                          });
                        }}
                      />
                      <EditableField
                        label="Artist"
                        value={track.artist}
                        onSave={v => {
                          const tracks = [...data.musicMoment!.playlist.tracks];
                          tracks[ti] = { ...tracks[ti], artist: v };
                          updateField('musicMoment', {
                            ...data.musicMoment!,
                            playlist: { ...data.musicMoment!.playlist, tracks },
                          });
                        }}
                      />
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          </>
        )}

        {localStatus !== 'approved' && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
            {crisisBlocked && (
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#b71c1c', fontWeight: 600 }}>
                Acknowledge the crisis notes above before approving any week.
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => void approveWeek()}
                disabled={approving || crisisBlocked}
                style={{ ...btnApprove, opacity: (approving || crisisBlocked) ? 0.4 : 1, cursor: crisisBlocked ? 'not-allowed' : 'pointer' }}
              >
                {approving ? 'Approving…' : `Approve Week ${data.week}`}
              </button>
              <span style={{ fontSize: 13, color: '#888' }}>Client sees this week immediately on approval.</span>
              {approveError && <p style={{ margin: 0, fontSize: 13, color: '#c62828' }}>{approveError}</p>}
            </div>
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
  hasCrisisNotes = false,
}: {
  planId: string;
  clientEmail: string;
  clientId: string;
  intake: IntakeSummary;
  plan: GeneratedPlan;
  createdAt: string;
  initialWeekStatuses?: Record<number, 'draft' | 'edited' | 'approved'>;
  hasCrisisNotes?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
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
            <p style={{ margin: 0, fontWeight: 700, color: '#111' }}>{clientEmail}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#666' }}>
              Week 1 draft · Generated {createdAt} · {approvedCount}/{PROGRAM_WEEKS} weeks approved
            </p>
          </div>
          <button type="button" onClick={() => setExpanded(e => !e)} style={btnSecondary}>
            {expanded ? 'Collapse' : 'Review & edit plan'}
          </button>
        </div>

        {/* Progress bar */}
        {expanded && (
          <div style={{ height: 4, background: '#f0f0f0' }}>
            <div style={{ height: '100%', background: '#2e7d32', width: `${(approvedCount / PROGRAM_WEEKS) * 100}%`, transition: 'width 0.3s' }} />
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
                  I have read the crisis notes and am proceeding with full awareness of this client's safety status.
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

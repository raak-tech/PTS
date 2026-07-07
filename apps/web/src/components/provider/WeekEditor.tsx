"use client";

import { useCallback, useState, type CSSProperties } from 'react';

import type { WeekPlan } from '@/lib/plan-generator';
import {
  getWeekReinforcementTemplates,
  withWeekReinforcementTemplates,
  type ReinforcementTemplate,
} from '@/lib/reinforcement-templates';

export const btnSecondary: CSSProperties = {
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

export const btnApprove: CSSProperties = {
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
export function EditableField({
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

// Editable week card — all fields inline editable. Used by the plan review queue
// and the client workspace Plan tab.
export function WeekEditor({
  week,
  planId,
  weekStatus,
  crisisBlocked,
  defaultOpen = false,
  onSaved,
  onApproved,
}: {
  week: WeekPlan;
  planId: string;
  weekStatus: 'draft' | 'edited' | 'approved';
  crisisBlocked: boolean;
  defaultOpen?: boolean;
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
    <details open={defaultOpen} style={{ border: '1px solid #e8e8e8', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
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

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { AdminClientDossier, AdminDossierPlan } from '@/lib/admin-client-dossier';
import type { GeneratedPlan } from '@/lib/plan-generator';

type Props = {
  clientId: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28, background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 20 }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700 }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#222', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{value ?? '—'}</div>
    </div>
  );
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function parseJsonField(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.join(', ');
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed as Record<string, string>)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
    }
    return String(parsed);
  } catch {
    return raw;
  }
}

type CounselorNote = {
  id: string;
  clientId: string;
  authorId: string;
  body: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
};

export function AdminClientDossierClient({ clientId }: Props) {
  const [dossier, setDossier] = useState<AdminClientDossier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [notes, setNotes] = useState<CounselorNote[]>([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  useEffect(() => {
    void fetch(`/api/admin/clients/${clientId}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          setError(res.status === 404 ? 'Client not found.' : 'Could not load client dossier.');
          return;
        }
        const data = (await res.json()) as { dossier: AdminClientDossier };
        setDossier(data.dossier);
      })
      .catch(() => setError('Could not load client dossier.'));
  }, [clientId]);

  const loadNotes = () => {
    void fetch(`/api/admin/clients/${clientId}/notes`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { notes: CounselorNote[] };
        setNotes(data.notes ?? []);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    loadNotes();
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmitNote = async () => {
    if (!noteDraft.trim()) return;
    setSubmittingNote(true);
    setNoteError('');
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/notes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteDraft.trim() }),
      });
      if (!res.ok) {
        setNoteError('Could not save note.');
        return;
      }
      setNoteDraft('');
      loadNotes();
    } catch {
      setNoteError('Network error saving note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const unresolvedNotes = notes.filter((n) => !n.resolvedAt);
  const resolvedNotes = notes.filter((n) => n.resolvedAt);

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <p>{error}</p>
        <Link href="/admin">← Admin dashboard</Link>
      </div>
    );
  }

  if (!dossier) {
    return <div style={{ padding: 32 }}>Loading client dossier…</div>;
  }

  const { client, intake, counselor, plans, messages, reinforcements, calendar, scheduleFeedback, holisticCompletions, artifacts, consent, weeklySummary, weeklyCheckIns, eveningReflections } = dossier;
  const label = client.displayName ?? client.email;

  let approvedPlan: GeneratedPlan | null = null;
  if (dossier.approvedPlanContent) {
    try {
      approvedPlan = JSON.parse(dossier.approvedPlanContent) as GeneratedPlan;
    } catch {
      approvedPlan = null;
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto', fontFamily: 'inherit' }}>
      <p style={{ margin: '0 0 16px' }}>
        <Link href="/admin" style={{ fontSize: 14, color: '#555' }}>
          ← Admin dashboard
        </Link>
      </p>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{label}</h1>
        <p style={{ margin: '6px 0 0', color: '#666', fontSize: 14 }}>
          Admin due-diligence view · generated {formatWhen(dossier.generatedAt)}
        </p>
      </div>

      {(intake?.hasRedFlags || intake?.isSafe === false) && (
        <div style={{ background: '#ffebee', border: '1.5px solid #ef9a9a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <strong style={{ color: '#b71c1c' }}>Safety escalation</strong>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>
            {intake.hasRedFlags ? 'Red flags reported in intake. ' : ''}
            {intake.isSafe === false ? 'Client reported feeling unsafe.' : ''}
          </p>
        </div>
      )}

      <Section title="Notes for counselor">
        {unresolvedNotes.length > 0 ? (
          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {unresolvedNotes.map((n) => (
              <div key={n.id} style={{ padding: 12, borderRadius: 10, background: '#fff8e1', border: '1px solid #ffe082' }}>
                <div style={{ fontSize: 12, color: '#8d6e00', marginBottom: 6 }}>
                  Unresolved · flagged {formatWhen(n.createdAt)}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{n.body}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: '0 0 16px', color: '#666', fontSize: 14 }}>No open notes for this client.</p>
        )}

        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Flag something for the counselor to address (e.g. billing question, escalation, scheduling conflict)…"
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 8,
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            marginBottom: 8,
          }}
        />
        {noteError ? <p style={{ color: '#b71c1c', fontSize: 13, margin: '0 0 8px' }}>{noteError}</p> : null}
        <button
          type="button"
          onClick={() => void onSubmitNote()}
          disabled={submittingNote || !noteDraft.trim()}
          style={{
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            background: submittingNote ? '#999' : '#111',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: submittingNote ? 'default' : 'pointer',
          }}
        >
          {submittingNote ? 'Flagging…' : 'Flag for counselor'}
        </button>

        {resolvedNotes.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Resolved ({resolvedNotes.length})</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {resolvedNotes.map((n) => (
                <div key={n.id} style={{ padding: 10, borderRadius: 8, background: '#f5f5f5', fontSize: 13, color: '#666' }}>
                  {n.body}
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    Flagged {formatWhen(n.createdAt)} · resolved {formatWhen(n.resolvedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="Account">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <Field label="User ID" value={client.id} />
          <Field label="Role" value={client.role} />
          <Field label="Email" value={client.email} />
          <Field label="Phone" value={client.phone ?? '—'} />
          <Field label="Registered" value={formatWhen(client.createdAt)} />
        </div>
        {consent ? (
          <div style={{ marginTop: 12, fontSize: 14 }}>
            <strong>Data storage consent:</strong>{' '}
            {consent.dataStorageEnabled ? `enabled ${formatWhen(consent.enabledAt)}` : 'not enabled'}
          </div>
        ) : null}
      </Section>

      {counselor ? (
        <Section title="Assigned counselor">
          <Field label="Name" value={counselor.name ?? counselor.email} />
          <Field label="Email" value={counselor.email} />
          <Field label="Phone" value={counselor.phone ?? '—'} />
          <Field label="Assigned" value={formatWhen(counselor.assignedAt)} />
        </Section>
      ) : (
        <Section title="Assigned counselor">
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>No counselor assigned yet.</p>
        </Section>
      )}

      {intake ? (
        <Section title="Intake submission">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Field label="Pain source" value={intake.painSourceOther ?? intake.painSource} />
            <Field label="Duration" value={intake.painDuration} />
            <Field label="Age range" value={intake.ageRange} />
            <Field label="Gender" value={intake.gender} />
            <Field label="Occupation" value={intake.occupation} />
            <Field label="Location" value={intake.countryRegion} />
            <Field label="Affects work" value={intake.affectsWork} />
            <Field label="Dependents" value={intake.hasDependents == null ? '—' : intake.hasDependents ? 'Yes' : 'No'} />
            <Field label="Prior therapy" value={intake.priorTherapy} />
            <Field label="Completed" value={formatWhen(intake.completedAt)} />
          </div>
          <Field label="Situation" value={intake.painDescription} />
          <Field label="Activities affected" value={parseJsonField(intake.activitiesAffected)} />
          <Field label="Biggest change" value={intake.biggestChange} />
          <Field label="Recovery goal" value={intake.recoveryGoal} />
          <Field label="Timeline" value={intake.recoveryTimeline} />
          <Field label="Current treatment" value={intake.currentTreatment} />
          <Field label="Social support" value={intake.socialSupport} />
          <Field label="Structure preference" value={intake.structurePreference} />
          <Field label="Engagement time" value={intake.engagementTime} />
          <Field label="Ayurveda preferences" value={parseJsonField(intake.ayurvedaPreferences)} />
        </Section>
      ) : (
        <Section title="Intake submission">
          <p style={{ margin: 0, color: '#666' }}>No intake on file.</p>
        </Section>
      )}

      <Section title={`Plans (${plans.length})`}>
        {plans.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>No plans generated.</p>
        ) : (
          plans.map((plan: AdminDossierPlan) => (
            <div key={plan.id} style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong>{plan.status}</strong>
                  {plan.counselorNotes?.includes('CRISIS') ? (
                    <span style={{ color: '#b71c1c', marginLeft: 8 }}>CRISIS</span>
                  ) : null}
                  <div style={{ fontSize: 13, color: '#888' }}>
                    {plan.id.slice(0, 8)}… · {plan.weekCount} weeks · created {formatWhen(plan.createdAt)}
                    {plan.approvedAt ? ` · approved ${formatWhen(plan.approvedAt)}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                  style={{ fontSize: 13, cursor: 'pointer' }}
                >
                  {expandedPlanId === plan.id ? 'Hide JSON' : 'View plan JSON'}
                </button>
              </div>
              {plan.overview ? <p style={{ fontSize: 14, margin: '8px 0 0' }}>{plan.overview}</p> : null}
              {plan.clientSummary ? (
                <p style={{ fontSize: 13, color: '#555', margin: '6px 0 0' }}>
                  <em>Counselor summary:</em> {plan.clientSummary}
                </p>
              ) : null}
              {expandedPlanId === plan.id ? (
                <pre
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: '#f8f8f8',
                    borderRadius: 8,
                    fontSize: 11,
                    overflow: 'auto',
                    maxHeight: 400,
                  }}
                >
                  {JSON.stringify(JSON.parse(plan.generatedContent), null, 2)}
                </pre>
              ) : null}
            </div>
          ))
        )}
      </Section>

      {approvedPlan?.weeks[0] ? (
        <Section title="Active program — Week 1 snapshot">
          <Field label="Theme" value={`${approvedPlan.weeks[0].theme} — ${approvedPlan.weeks[0].focus}`} />
          {approvedPlan.weeks[0].yogaTrial ? (
            <Field label="Yoga trial" value={approvedPlan.weeks[0].yogaTrial.principle} />
          ) : null}
          {approvedPlan.weeks[0].musicMoment?.playlist ? (
            <Field label="Music" value={approvedPlan.weeks[0].musicMoment.playlist.title} />
          ) : null}
        </Section>
      ) : null}

      <Section title={`Messages (${messages.length})`}>
        {messages.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>No messages.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: m.direction === 'outbound' ? '#f3f8ff' : '#f5f5f5',
                  border: '1px solid #e8e8e8',
                }}
              >
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
                  {m.direction === 'outbound' ? 'Client sent' : 'Client received'} · {formatWhen(m.createdAt)}
                  {m.readAt ? ' · read' : ' · unread'}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                  {m.from.label} → {m.to.label}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.body}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Daily read-outs & responses">
        {reinforcements.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>No read-outs assigned.</p>
        ) : (
          reinforcements.map((r) => (
            <div key={r.id} style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 12 }}>
              <strong>{r.title}</strong>
              <div style={{ fontSize: 13, color: '#888' }}>
                Week {r.planWeek ?? '—'} · {r.startDate} → {r.endDate}
                {r.hasCounselorAudio ? ' · counselor audio attached' : ''}
              </div>
              <p style={{ fontSize: 14, margin: '8px 0' }}>{r.bodyText}</p>
              {r.responses.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                  {r.responses.map((resp) => (
                    <li key={resp.id} style={{ marginBottom: 6 }}>
                      {resp.responseType} · {formatWhen(resp.submittedAt)}
                      {resp.bodyText ? ` — ${resp.bodyText.slice(0, 120)}` : resp.hasAudio ? ' — voice response' : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: '#888', margin: 0 }}>No client responses yet.</p>
              )}
            </div>
          ))
        )}
      </Section>

      {weeklySummary ? (
        <Section title="This week engagement summary">
          <Field label="Read-out responses" value={weeklySummary.reinforcementResponses} />
          <Field label="Calendar blocks done" value={weeklySummary.blocksCompleted} />
          <Field label="Blocks skipped" value={weeklySummary.blocksSkipped} />
          <Field label="Evening reflections" value={weeklySummary.eveningReflectionCount} />
          {weeklySummary.scheduleInsights.length > 0 ? (
            <Field label="Scheduling feedback" value={weeklySummary.scheduleInsights.join('\n')} />
          ) : null}
          {weeklySummary.latestWeeklyCheckIn ? (
            <Field label="Latest weekly check-in" value={weeklySummary.latestWeeklyCheckIn} />
          ) : null}
        </Section>
      ) : null}

      <Section title={`Weekly check-ins (${weeklyCheckIns.length})`}>
        {weeklyCheckIns.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>None submitted.</p>
        ) : (
          weeklyCheckIns.map((c) => (
            <div key={c.id} style={{ marginBottom: 16 }}>
              <strong>
                Week {c.weekNumber} · {c.weekStartIso}
              </strong>
              <div style={{ fontSize: 12, color: '#888' }}>{formatWhen(c.submittedAt)}</div>
              <p style={{ fontSize: 14, margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{c.summary}</p>
            </div>
          ))
        )}
      </Section>

      <Section title={`Evening reflections (${eveningReflections.length})`}>
        {eveningReflections.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>None submitted.</p>
        ) : (
          eveningReflections.map((r) => (
            <div key={r.dateIso} style={{ marginBottom: 12 }}>
              <strong>{r.dateIso}</strong>
              <div style={{ fontSize: 12, color: '#888' }}>{formatWhen(r.submittedAt)}</div>
              <p style={{ fontSize: 14, margin: '6px 0 0' }}>{r.bodyText}</p>
            </div>
          ))
        )}
      </Section>

      <Section title={`Calendar entries (${calendar.length} recent)`}>
        {calendar.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>No calendar data.</p>
        ) : (
          calendar.map((day) => (
            <div key={day.dateIso} style={{ marginBottom: 12 }}>
              <strong>{day.dateIso}</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13 }}>
                {day.blocks.map((b) => (
                  <li key={b.id}>
                    {b.plannedTime ? `${b.plannedTime} · ` : ''}
                    {b.label} ({b.status})
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Section>

      <Section title={`Evening scheduling feedback (${scheduleFeedback.length})`}>
        {scheduleFeedback.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>None submitted.</p>
        ) : (
          scheduleFeedback.map((f) => (
            <div key={f.dateIso} style={{ marginBottom: 12, fontSize: 14 }}>
              <strong>{f.dateIso}</strong>
              {f.workedText ? <div>Worked: {f.workedText}</div> : null}
              {f.didntWorkText ? <div>Didn&apos;t work: {f.didntWorkText}</div> : null}
            </div>
          ))
        )}
      </Section>

      <Section title={`Holistic completions (${holisticCompletions.length})`}>
        {holisticCompletions.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>None logged.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            {holisticCompletions.map((h) => (
              <li key={h.id ?? `${h.dateIso}-${h.activityType}`}>
                {h.dateIso} · week {h.weekNumber} · {h.activityType} · {formatWhen(h.completedAt)}
                {h.notes ? ` — “${h.notes}”` : ''}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {artifacts.length > 0 ? (
        <Section title={`Support artifacts (${artifacts.length})`}>
          {artifacts.map((a) => (
            <div key={a.id} style={{ marginBottom: 12 }}>
              <strong>
                {a.kind}: {a.title}
              </strong>
              <div style={{ fontSize: 12, color: '#888' }}>{formatWhen(a.createdAt)}</div>
              <p style={{ fontSize: 14, margin: '6px 0 0' }}>{a.bodyText}</p>
            </div>
          ))}
        </Section>
      ) : null}
    </div>
  );
}

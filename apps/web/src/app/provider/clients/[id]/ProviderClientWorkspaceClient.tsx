'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CounselorReadOutEditor } from '@/components/CounselorReadOutEditor';

type EngagementRow = {
  clientId: string;
  name: string;
  reinforcementTitle: string | null;
  reinforcementRecordedToday: boolean;
  calendarBlocksTotal: number;
  calendarBlocksDone: number;
  holisticDone?: number;
  holisticTotal?: number;
  checkInDone?: boolean;
  assignedTaskCount?: number;
  completedTaskCount?: number;
  completionPct?: number;
};

type WeeklySummary = {
  reinforcementResponses: number;
  blocksCompleted: number;
  blocksSkipped: number;
  scheduleInsights: string[];
};

type WeekDraft = {
  week: number;
  theme: string;
  focus: string;
  dailyPractices: { title: string; description: string; duration: string }[];
  weeklyReflection: string;
  counselorNote: string;
  reinforcementTemplate?: { title: string; bodyText: string };
  yogaTrial?: { principle: string };
  musicMoment?: { playlist?: { title: string; purpose?: string } };
};

type WeekStatus = 'draft' | 'edited' | 'approved';

type ArtifactRow = { id: string; kind: string; title: string; createdAt: string };

type OverviewProps = {
  registered: string;
  storageConsent: boolean;
  artifactCount: number;
  kindCounts: Record<string, number>;
  artifacts: ArtifactRow[];
};

type IntakeSummary = {
  painSource: string;
  painDescription: string;
  recoveryGoal: string;
  hasRedFlags: boolean;
  isSafe: boolean;
  completedAt: string | null;
};

type CounselorNote = {
  id: string;
  body: string;
  createdAt: string;
  resolvedAt: string | null;
};

type MessagePreview = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: string;
};

type Props = {
  clientId: string;
  clientLabel: string;
  planId?: string;
  initialWeekStatuses?: Record<number, WeekStatus>;
  totalWeeks?: number;
  overview: OverviewProps;
  intake?: IntakeSummary | null;
  initialTab?: 'overview' | 'plan' | 'readouts' | 'messages';
};

const TABS = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'plan' as const, label: 'Plan' },
  { id: 'readouts' as const, label: 'Read-outs' },
  { id: 'messages' as const, label: 'Messages' },
];

export function ProviderClientWorkspaceClient({
  clientId,
  clientLabel,
  planId: initialPlanId,
  initialWeekStatuses = {},
  totalWeeks = 6,
  overview,
  intake = null,
  initialTab = 'overview',
}: Props) {
  const [tab, setTab] = useState(initialTab);
  const [engagement, setEngagement] = useState<EngagementRow | null>(null);
  const [summary, setSummary] = useState('');
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [regenWeek, setRegenWeek] = useState(false);
  const [weekSuggestions, setWeekSuggestions] = useState<string[]>([]);
  const [weekDraft, setWeekDraft] = useState<WeekDraft | null>(null);
  const [applyingWeek, setApplyingWeek] = useState(false);
  const [message, setMessage] = useState('');
  const [planId, setPlanId] = useState(initialPlanId ?? '');
  const [weekStatuses, setWeekStatuses] = useState<Record<number, WeekStatus>>(initialWeekStatuses);
  const [approvingWeek, setApprovingWeek] = useState<number | null>(null);
  const [approveError, setApproveError] = useState('');
  const [notes, setNotes] = useState<CounselorNote[]>([]);
  const [resolvingNoteId, setResolvingNoteId] = useState<string | null>(null);
  const [recentMessages, setRecentMessages] = useState<MessagePreview[]>([]);
  const [scheduleRequired, setScheduleRequired] = useState(false);
  const [scheduleCompletedAt, setScheduleCompletedAt] = useState<string | null>(null);
  const [togglingSchedule, setTogglingSchedule] = useState(false);
  const [currentWeekContent, setCurrentWeekContent] = useState<WeekDraft | null>(null);

  const approvedCount = Object.values(weekStatuses).filter((s) => s === 'approved').length;

  useEffect(() => {
    void Promise.all([
      fetch(`/api/provider/engagement?clientId=${encodeURIComponent(clientId)}`, { credentials: 'include' }).then(
        (r) => r.json(),
      ),
      fetch(`/api/provider/clients/${clientId}/schedule`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/plans?userId=${encodeURIComponent(clientId)}`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/provider/clients/${clientId}/weekly-summary`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/provider/clients/${clientId}/notes`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/messages?with=${encodeURIComponent(clientId)}`, { credentials: 'include' }).then((r) => r.json()),
    ]).then(([engagementData, scheduleData, planData, weeklyData, notesData, messagesData]) => {
      const row = (engagementData.clients as EngagementRow[] | undefined)?.[0];
      if (row) setEngagement(row);

      if (scheduleData.scheduleRequired) setScheduleRequired(true);
      if (scheduleData.scheduleCompletedAt) setScheduleCompletedAt(scheduleData.scheduleCompletedAt as string);

      if (planData.plan) {
        if (!planId && planData.plan.id) setPlanId(planData.plan.id as string);
        if (planData.plan.generatedContent) {
          try {
            const parsed = JSON.parse(planData.plan.generatedContent as string) as {
              clientSummary?: string;
              weeks?: WeekDraft[];
            };
            if (parsed.clientSummary) setSummary(parsed.clientSummary);
            const approvedWeek = Object.entries(weekStatuses).find(([, s]) => s === 'approved')?.[0];
            const weekIdx = approvedWeek ? Number(approvedWeek) - 1 : 0;
            const week = parsed.weeks?.[weekIdx] ?? parsed.weeks?.[0];
            if (week) setCurrentWeekContent(week);
            const template = week?.reinforcementTemplate ?? parsed.weeks?.[0]?.reinforcementTemplate;
            if (template) {
              setTemplateTitle(template.title);
              setTemplateBody(template.bodyText);
            }
          } catch {
            /* ignore */
          }
        }
      }

      if (weeklyData.summary) setWeekly(weeklyData.summary as WeeklySummary);
      if (notesData.notes) setNotes(notesData.notes as CounselorNote[]);
      if (Array.isArray(messagesData.messages)) {
        setRecentMessages((messagesData.messages as MessagePreview[]).slice(-5));
      }
    });
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onResolveNote = async (noteId: string) => {
    setResolvingNoteId(noteId);
    try {
      const res = await fetch(`/api/provider/clients/${clientId}/notes/${noteId}/resolve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, resolvedAt: new Date().toISOString() } : n)),
        );
      }
    } finally {
      setResolvingNoteId(null);
    }
  };

  const unresolvedNotes = notes.filter((n) => !n.resolvedAt);

  const onToggleSchedule = async () => {
    setTogglingSchedule(true);
    try {
      const res = await fetch(`/api/provider/clients/${clientId}/schedule`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ required: !scheduleRequired }),
      });
      if (res.ok) {
        const data = await res.json();
        setScheduleRequired(Boolean(data.scheduleRequired));
      }
    } finally {
      setTogglingSchedule(false);
    }
  };

  const onRegenerateWeek = async () => {
    setRegenWeek(true);
    setMessage('');
    setWeekDraft(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 320_000);
      const res = await fetch(`/api/provider/clients/${clientId}/regenerate-week`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber: 1 }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (!res.ok) {
        const err = data.error === 'forbidden' ? 'Not linked to this client yet.' : data.detail ?? data.error ?? 'Week generation failed';
        setMessage(err);
        return;
      }
      setWeekSuggestions(data.suggestions ?? []);
      setWeekDraft(data.weekDraft ?? null);
      setMessage(`Week ${data.weekNumber} draft ready — review below, then apply to the client's live plan.`);
    } finally {
      setRegenWeek(false);
    }
  };

  const onApplyWeek = async () => {
    if (!weekDraft) return;
    setApplyingWeek(true);
    setMessage('');
    try {
      const res = await fetch(`/api/provider/clients/${clientId}/apply-week`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: weekDraft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.detail ?? data.error ?? 'Could not apply week');
        return;
      }
      setMessage(`Week ${data.weekNumber} applied — review it in the plan queue, then approve to release to client.`);
      setWeekDraft(null);
    } finally {
      setApplyingWeek(false);
    }
  };

  const onApproveWeek = async (weekNumber: number) => {
    if (!planId) {
      setApproveError('No plan found for this client yet.');
      return;
    }
    setApprovingWeek(weekNumber);
    setApproveError('');
    try {
      const res = await fetch(`/api/provider/plans/${planId}/week/${weekNumber}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setApproveError(data.error ?? 'Approval failed');
        return;
      }
      setWeekStatuses((prev) => ({ ...prev, [weekNumber]: 'approved' }));
      setMessage(`Week ${weekNumber} approved — client can now see it in their app.`);
    } catch {
      setApproveError('Network error — approval not saved');
    } finally {
      setApprovingWeek(null);
    }
  };

  const statusColour: Record<WeekStatus, string> = {
    draft: 'var(--muted)',
    edited: 'var(--warning)',
    approved: 'var(--success)',
  };

  const statusLabel: Record<WeekStatus, string> = {
    draft: 'Draft',
    edited: 'Edited',
    approved: '✓ Approved',
  };

  return (
    <>
      <h1 className="provider-page-title" style={{ marginTop: 8 }}>
        {clientLabel}
      </h1>
      {summary ? (
        <p className="provider-page-subtitle" style={{ marginBottom: 20 }}>
          {summary}
        </p>
      ) : (
        <p className="provider-page-subtitle">Client workspace</p>
      )}

      <div className="provider-tabs" role="tablist" aria-label="Client sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="provider-tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="provider-tab-panel" data-active={tab === 'overview'} role="tabpanel">
        {unresolvedNotes.length > 0 ? (
          <section className="provider-panel provider-panel--attention">
            <h2>Admin notes ({unresolvedNotes.length})</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {unresolvedNotes.map((note) => (
                <div key={note.id} className="provider-queue-item">
                  <div>
                    <div style={{ fontSize: '0.875rem' }}>{note.body}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 4 }}>
                      Flagged {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={resolvingNoteId === note.id}
                    onClick={() => void onResolveNote(note.id)}
                  >
                    {resolvingNoteId === note.id ? 'Marking…' : 'Mark addressed'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {intake ? (
          <section className="provider-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h2 style={{ margin: 0 }}>Intake</h2>
              {intake.hasRedFlags || !intake.isSafe ? (
                <span className="provider-tag provider-tag--danger">Red flags</span>
              ) : null}
            </div>
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
              <li>
                <strong>Pain source:</strong> {intake.painSource}
              </li>
              <li>
                <strong>Description:</strong> {intake.painDescription}
              </li>
              <li>
                <strong>Recovery goal:</strong> {intake.recoveryGoal}
              </li>
              {intake.completedAt ? (
                <li>
                  <strong>Submitted:</strong> {new Date(intake.completedAt).toLocaleDateString()}
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}

        <section className="provider-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Plan status</h2>
            <button type="button" onClick={() => setTab('plan')} style={{ fontSize: 13 }}>
              Open Plan tab →
            </button>
          </div>
          <p style={{ marginTop: 12, marginBottom: 0, fontSize: 14 }}>
            {planId
              ? `${approvedCount} / ${totalWeeks} weeks approved`
              : 'No plan generated for this client yet.'}
          </p>
        </section>

        {recentMessages.length > 0 ? (
          <section className="provider-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Recent messages</h2>
              <button type="button" onClick={() => setTab('messages')} style={{ fontSize: 13 }}>
                Open thread →
              </button>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {recentMessages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: m.fromUserId === clientId ? 'var(--surface-2)' : 'var(--accent-soft)',
                    fontSize: 13,
                  }}
                >
                  <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 4 }}>
                    {m.fromUserId === clientId ? 'Client' : 'You'} ·{' '}
                    {new Date(m.createdAt).toLocaleDateString()}
                  </div>
                  {m.body}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="provider-panel">
          <h2>Profile</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              <strong>Registered:</strong> {overview.registered}
            </li>
            <li>
              <strong>Storage consent:</strong> {overview.storageConsent ? 'Enabled' : 'Not enabled'}
            </li>
            <li>
              <strong>Saved artifacts:</strong> {overview.artifactCount}
            </li>
            {Object.entries(overview.kindCounts).map(([kind, count]) => (
              <li key={kind}>
                <strong>{kind}:</strong> {count}
              </li>
            ))}
          </ul>
        </section>

        <section className="provider-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0 }}>Today&apos;s actions</h2>
            {engagement?.completionPct != null && engagement.assignedTaskCount ? (
              <span className="provider-tag provider-tag--ok">{engagement.completionPct}% complete</span>
            ) : null}
          </div>
          {engagement && engagement.assignedTaskCount ? (
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
              <li>
                <strong>Check-in:</strong> {engagement.checkInDone ? '✓ done' : '○ pending'}
              </li>
              <li>
                <strong>Read-out:</strong>{' '}
                {engagement.reinforcementRecordedToday ? '✓ recorded' : '○ pending'}
              </li>
              <li>
                <strong>Holistic:</strong> {engagement.holisticDone ?? 0}/{engagement.holisticTotal ?? 3}
              </li>
              <li>
                <strong>Calendar:</strong> {engagement.calendarBlocksDone}/{engagement.calendarBlocksTotal} blocks
                done
              </li>
            </ul>
          ) : (
            <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              No assigned daily tasks yet — approve a plan week or add read-outs to activate tracking.
            </p>
          )}
        </section>

        <section className="provider-panel">
          <h2>Daily schedule request</h2>
          <p style={{ marginTop: 0, fontSize: 14, color: 'var(--muted)' }}>
            One-time ask for the client to plan their day in the mobile app.
          </p>
          <button type="button" onClick={() => void onToggleSchedule()} disabled={togglingSchedule}>
            {togglingSchedule
              ? 'Saving…'
              : scheduleRequired
                ? 'Schedule requested (tap to cancel)'
                : 'Ask client to plan their day'}
          </button>
          {scheduleRequired ? (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--muted)' }}>
              Status:{' '}
              {scheduleCompletedAt
                ? `Client filled schedule · ${new Date(scheduleCompletedAt).toLocaleString()}`
                : 'Waiting for client to build today’s schedule'}
            </p>
          ) : null}
        </section>

        {weekly ? (
          <section className="provider-panel">
            <h2>This week&apos;s data</h2>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              <li>
                <strong>Read-out responses:</strong> {weekly.reinforcementResponses}
              </li>
              <li>
                <strong>Calendar blocks done:</strong> {weekly.blocksCompleted}
              </li>
              <li>
                <strong>Blocks skipped:</strong> {weekly.blocksSkipped}
              </li>
            </ul>
            {weekly.scheduleInsights.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Scheduling feedback</p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {weekly.scheduleInsights.slice(0, 5).map((line) => (
                    <li key={line} style={{ fontSize: 14, marginBottom: 4 }}>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {overview.artifacts.length > 0 ? (
          <section className="provider-panel">
            <h2>Activity log</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {overview.artifacts.map((a) => (
                <div
                  key={a.id}
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    background: 'var(--surface-2)',
                  }}
                >
                  <strong>{a.kind}</strong> — {a.title}{' '}
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!overview.storageConsent ? (
          <section className="provider-panel">
            <p style={{ margin: 0 }}>
              This client has not enabled data storage. No artifacts are available for review.
            </p>
          </section>
        ) : null}
      </div>

      <div className="provider-tab-panel" data-active={tab === 'plan'} role="tabpanel">
        {currentWeekContent ? (
          <section className="provider-panel">
            <h2>Current week content</h2>
            <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
              Week {currentWeekContent.week}: {currentWeekContent.theme}
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--muted)' }}>{currentWeekContent.focus}</p>
            {currentWeekContent.musicMoment?.playlist ? (
              <p style={{ margin: '0 0 8px', fontSize: 14 }}>
                <strong>Music:</strong> {currentWeekContent.musicMoment.playlist.title}
                {currentWeekContent.musicMoment.playlist.purpose
                  ? ` — ${currentWeekContent.musicMoment.playlist.purpose}`
                  : ''}
              </p>
            ) : null}
            {currentWeekContent.yogaTrial ? (
              <p style={{ margin: '0 0 8px', fontSize: 14 }}>
                <strong>Yoga trial:</strong> {currentWeekContent.yogaTrial.principle}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="provider-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Week approvals</h2>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
              {approvedCount} / {totalWeeks} weeks approved
            </span>
          </div>

          <div
            style={{
              height: 6,
              background: 'var(--surface-2)',
              borderRadius: 3,
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--success)',
                borderRadius: 3,
                width: `${totalWeeks > 0 ? (approvedCount / totalWeeks) * 100 : 0}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => {
              const status = weekStatuses[weekNum] ?? 'draft';
              const isApproving = approvingWeek === weekNum;
              return (
                <div
                  key={weekNum}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${status === 'approved' ? 'rgba(155, 196, 168, 0.45)' : 'var(--border-light)'}`,
                    background: status === 'approved' ? 'rgba(155, 196, 168, 0.1)' : 'var(--surface-2)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Week {weekNum}</span>
                    <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, color: statusColour[status] }}>
                      {statusLabel[status]}
                    </span>
                  </div>
                  {status !== 'approved' ? (
                    <button
                      type="button"
                      disabled={isApproving || !planId}
                      onClick={() => void onApproveWeek(weekNum)}
                      style={{ opacity: isApproving ? 0.7 : 1 }}
                    >
                      {isApproving ? 'Approving…' : `Approve Week ${weekNum}`}
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--success)' }}>Client can see this week ✓</span>
                  )}
                </div>
              );
            })}
          </div>

          {approveError ? (
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--danger)' }}>{approveError}</p>
          ) : null}
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
            To edit week content inline, use the{' '}
            <Link href="/provider/plans">plan review queue</Link>.
          </p>
        </section>

        <section className="provider-panel">
          <h2>Next week planning (AI)</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>
            Uses this week&apos;s engagement data to draft the next week with holistic blocks. Takes 1–2 minutes.
          </p>
          <button type="button" onClick={() => void onRegenerateWeek()} disabled={regenWeek}>
            {regenWeek ? 'Generating next week draft…' : 'Generate next week draft'}
          </button>
          {weekSuggestions.length > 0 ? (
            <ul style={{ marginTop: 12, lineHeight: 1.6 }}>
              {weekSuggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : null}
          {weekDraft ? (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                background: 'var(--surface-2)',
              }}
            >
              <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
                Week {weekDraft.week}: {weekDraft.theme}
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--muted)' }}>{weekDraft.focus}</p>
              <p style={{ margin: '0 0 4px', fontSize: 13 }}>
                <strong>Read-out:</strong> {weekDraft.reinforcementTemplate?.title ?? '—'}
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 13 }}>
                <strong>Yoga:</strong> {weekDraft.yogaTrial?.principle ?? '—'}
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 13 }}>
                <strong>Music:</strong> {weekDraft.musicMoment?.playlist?.title ?? '—'}
              </p>
              <button type="button" onClick={() => void onApplyWeek()} disabled={applyingWeek}>
                {applyingWeek ? 'Applying…' : `Apply Week ${weekDraft.week} draft to plan`}
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <div className="provider-tab-panel" data-active={tab === 'readouts'} role="tabpanel">
        <section className="provider-panel">
          <h2>Daily read-outs</h2>
          <CounselorReadOutEditor
            clientId={clientId}
            initialTitle={templateTitle}
            initialBody={templateBody}
          />
        </section>
      </div>

      <div className="provider-tab-panel" data-active={tab === 'messages'} role="tabpanel">
        <section className="provider-panel">
          <h2>Messages</h2>
          <p style={{ marginTop: 0, color: 'var(--muted)' }}>
            Open a secure thread with this client.
          </p>
          <Link href={`/provider/messages?with=${clientId}`} className="actionLink">
            Open message thread →
          </Link>
        </section>
      </div>

      {message ? (
        <p role="status" className="statusBanner" style={{ marginTop: 24 }}>
          {message}
        </p>
      ) : null}
    </>
  );
}

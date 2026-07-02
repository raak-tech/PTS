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
  weekStart: string;
  weekEnd: string;
  reinforcementResponses: number;
  blocksCompleted: number;
  blocksPartial?: number;
  blocksSkipped: number;
  scheduleInsights: string[];
  painTrend: string | null;
  morningCheckIns: { dateIso: string; painLevel: number; sleepQuality: string; intention: string | null }[];
  readOutSummaries: string[];
  eveningReflectionSamples: string[];
  clientShares: string[];
  latestWeeklyCheckIn: string | null;
  holisticCompletions?: { activityType: string; count: number }[];
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
type WeekDisplayStatus = WeekStatus | 'not_started';

type ArtifactRow = { id: string; kind: string; title: string; bodyText?: string; createdAt: string };

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
  const [weekComment, setWeekComment] = useState('');
  const [savingWeekComment, setSavingWeekComment] = useState(false);

  const approvedCount = Object.values(weekStatuses).filter((s) => s === 'approved').length;
  const nextWeekNumber = approvedCount + 1;
  const clientShares = overview.artifacts.filter((a) => a.kind === 'counselor-share');

  const weekDisplayStatus = (weekNum: number): WeekDisplayStatus =>
    weekStatuses[weekNum] ?? 'not_started';

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
    const sourceWeek = approvedCount > 0 ? approvedCount : 1;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 320_000);
      const res = await fetch(`/api/provider/clients/${clientId}/regenerate-week`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber: sourceWeek }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (!res.ok) {
        const err =
          data.error === 'counselor_comment_required'
            ? data.detail
            : data.error === 'forbidden'
              ? 'Not linked to this client yet.'
              : data.detail ?? data.error ?? 'Week generation failed';
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

  const onSaveWeekComment = async () => {
    if (!planId || approvedCount === 0) {
      setMessage('Approve at least one week before saving a comment for the next generation.');
      return;
    }
    setSavingWeekComment(true);
    setMessage('');
    try {
      const res = await fetch(`/api/provider/plans/${planId}/week/${approvedCount}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counselorWeekComment: weekComment }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? 'Could not save week comment');
        return;
      }
      setMessage(`Comment saved for Week ${approvedCount} — you can now generate Week ${approvedCount + 1}.`);
    } finally {
      setSavingWeekComment(false);
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

  const statusColour: Record<WeekDisplayStatus, string> = {
    draft: 'var(--muted)',
    edited: 'var(--warning)',
    approved: 'var(--success)',
    not_started: 'var(--muted)',
  };

  const statusLabel: Record<WeekDisplayStatus, string> = {
    draft: 'Draft',
    edited: 'Edited',
    approved: '✓ Approved',
    not_started: 'Not started',
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
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>
              {weekly.weekStart} — {weekly.weekEnd}
            </p>
            {weekly.painTrend ? (
              <p style={{ margin: '0 0 12px', fontSize: 14 }}>
                <strong>Pain trend:</strong> {weekly.painTrend}
              </p>
            ) : null}
            {weekly.latestWeeklyCheckIn ? (
              <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6 }}>
                <strong>Latest weekly check-in:</strong> {weekly.latestWeeklyCheckIn}
              </p>
            ) : null}
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              <li>
                <strong>Read-out responses:</strong> {weekly.reinforcementResponses}
              </li>
              <li>
                <strong>Calendar blocks done:</strong> {weekly.blocksCompleted}
                {weekly.blocksPartial ? ` (+ ${weekly.blocksPartial} partial)` : ''}
              </li>
              <li>
                <strong>Blocks skipped:</strong> {weekly.blocksSkipped}
              </li>
            </ul>
            {weekly.morningCheckIns.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Morning check-ins</p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                  {weekly.morningCheckIns.slice(0, 7).map((c) => (
                    <li key={c.dateIso}>
                      {c.dateIso}: pain {c.painLevel}/10 · sleep {c.sleepQuality}
                      {c.intention ? ` · ${c.intention}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {weekly.readOutSummaries.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Read-out samples</p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                  {weekly.readOutSummaries.slice(0, 5).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {weekly.eveningReflectionSamples.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Evening reflections</p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                  {weekly.eveningReflectionSamples.slice(0, 3).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {weekly.holisticCompletions && weekly.holisticCompletions.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Holistic completions</p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                  {weekly.holisticCompletions.map((h) => (
                    <li key={h.activityType}>
                      {h.activityType}: {h.count}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {weekly.scheduleInsights.length > 0 ? (
              <div style={{ marginTop: 14 }}>
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
            {weekly.clientShares.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Client shares (for next week LLM)</p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                  {weekly.clientShares.slice(0, 5).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {clientShares.length > 0 ? (
                  <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                    Full messages are in Client updates below.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {clientShares.length > 0 ? (
          <section className="provider-panel">
            <h2>Client updates</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {clientShares.map((a) => (
                <div
                  key={a.id}
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    background: 'var(--surface-2)',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{a.title}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{a.bodyText}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 8 }}>
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
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
              const status = weekDisplayStatus(weekNum);
              const isApproving = approvingWeek === weekNum;
              const canApprove = status === 'draft' || status === 'edited';
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
                    border: `1px solid ${status === 'approved' ? 'rgba(155, 196, 168, 0.45)' : status === 'not_started' ? 'var(--border-light)' : 'var(--border-light)'}`,
                    background:
                      status === 'approved'
                        ? 'rgba(155, 196, 168, 0.1)'
                        : status === 'not_started'
                          ? 'transparent'
                          : 'var(--surface-2)',
                    opacity: status === 'not_started' ? 0.85 : 1,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Week {weekNum}</span>
                    <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, color: statusColour[status] }}>
                      {statusLabel[status]}
                    </span>
                    {status === 'not_started' ? (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                        Generate from Plan tab after prior week is approved.
                      </p>
                    ) : null}
                  </div>
                  {canApprove ? (
                    <button
                      type="button"
                      disabled={isApproving || !planId}
                      onClick={() => void onApproveWeek(weekNum)}
                      style={{ opacity: isApproving ? 0.7 : 1 }}
                    >
                      {isApproving ? 'Approving…' : `Approve Week ${weekNum}`}
                    </button>
                  ) : status === 'approved' ? (
                    <span style={{ fontSize: 12, color: 'var(--success)' }}>Client can see this week ✓</span>
                  ) : null}
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
            Save a clinical comment on the current approved week, then generate the next week using engagement data.
          </p>
          {approvedCount > 0 ? (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Comment on Week {approvedCount} (required before Week {approvedCount + 1})
              </label>
              <textarea
                value={weekComment}
                onChange={(e) => setWeekComment(e.target.value)}
                rows={4}
                placeholder="Clinical framing, adjustments, what to emphasize next week…"
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--border-light)' }}
              />
              <button
                type="button"
                style={{ marginTop: 8 }}
                onClick={() => void onSaveWeekComment()}
                disabled={savingWeekComment || weekComment.trim().length < 3}
              >
                {savingWeekComment ? 'Saving…' : `Save Week ${approvedCount} comment`}
              </button>
            </div>
          ) : null}
          <button type="button" onClick={() => void onRegenerateWeek()} disabled={regenWeek || approvedCount === 0}>
            {regenWeek
              ? `Generating Week ${nextWeekNumber} draft…`
              : approvedCount > 0
                ? `Generate Week ${nextWeekNumber} draft`
                : 'Approve Week 1 before generating Week 2'}
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

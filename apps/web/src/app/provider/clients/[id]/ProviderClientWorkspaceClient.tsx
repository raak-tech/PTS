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
  musicMoment?: { playlist?: { title: string } };
};

type WeekStatus = 'draft' | 'edited' | 'approved';

type Props = {
  clientId: string;
  clientLabel: string;
  planId?: string;
  initialWeekStatuses?: Record<number, WeekStatus>;
  totalWeeks?: number;
};

export function ProviderClientWorkspaceClient({
  clientId,
  clientLabel,
  planId: initialPlanId,
  initialWeekStatuses = {},
  totalWeeks = 6,
}: Props) {
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

  const approvedCount = Object.values(weekStatuses).filter(s => s === 'approved').length;

  useEffect(() => {
    void Promise.all([
      fetch('/api/provider/engagement', { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/plans?userId=${encodeURIComponent(clientId)}`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/provider/clients/${clientId}/weekly-summary`, { credentials: 'include' }).then((r) => r.json()),
    ]).then(([engagementData, planData, weeklyData]) => {
      const row = (engagementData.clients as EngagementRow[] | undefined)?.find(
        (c) => c.clientId === clientId,
      );
      if (row) setEngagement(row);

      if (planData.plan) {
        if (!planId && planData.plan.id) setPlanId(planData.plan.id as string);
        if (planData.plan.generatedContent) {
          try {
            const parsed = JSON.parse(planData.plan.generatedContent as string) as {
              clientSummary?: string;
              weeks?: { reinforcementTemplate?: { title: string; bodyText: string } }[];
            };
            if (parsed.clientSummary) setSummary(parsed.clientSummary);
            const template = parsed.weeks?.[0]?.reinforcementTemplate;
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
    });
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setMessage(data.detail ?? data.error ?? 'Week generation failed');
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
      setWeekStatuses(prev => ({ ...prev, [weekNumber]: 'approved' }));
      setMessage(`Week ${weekNumber} approved — client can now see it in their app.`);
    } catch {
      setApproveError('Network error — approval not saved');
    } finally {
      setApprovingWeek(null);
    }
  };

  const statusColour: Record<WeekStatus, string> = {
    draft:    '#888',
    edited:   '#f57c00',
    approved: '#2e7d32',
  };

  const statusLabel: Record<WeekStatus, string> = {
    draft:    'Draft',
    edited:   'Edited',
    approved: '✓ Approved',
  };

  return (
    <>
      <section className="heroPanel" style={{ marginTop: 24 }}>
        <h2>{clientLabel}</h2>
        {summary ? <p style={{ maxWidth: 720, lineHeight: 1.6 }}>{summary}</p> : null}
        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href={`/messages?with=${clientId}`} className="actionLink">
            Message client →
          </Link>
          <Link href="/provider/engagement" className="actionLink secondary">
            Engagement dashboard
          </Link>
          <Link href="/provider/plans" className="actionLink secondary">
            Plan queue (full edit)
          </Link>
        </div>
      </section>

      {engagement ? (
        <section className="sectionStack" style={{ marginTop: 24 }}>
          <h2>Today&apos;s engagement</h2>
          <ul style={{ lineHeight: 1.7 }}>
            <li>
              <strong>Read-out:</strong>{' '}
              {engagement.reinforcementRecordedToday ? '✓ recorded' : '○ pending'}
            </li>
            <li>
              <strong>Calendar:</strong> {engagement.calendarBlocksDone}/{engagement.calendarBlocksTotal} blocks done
            </li>
            <li>
              <strong>Holistic:</strong> {engagement.holisticDone ?? 0}/{engagement.holisticTotal ?? 3}
            </li>
          </ul>
        </section>
      ) : null}

      {weekly ? (
        <section className="sectionStack" style={{ marginTop: 24 }}>
          <h2>This week&apos;s data</h2>
          <ul style={{ lineHeight: 1.7 }}>
            <li><strong>Read-out responses:</strong> {weekly.reinforcementResponses}</li>
            <li><strong>Calendar blocks done:</strong> {weekly.blocksCompleted}</li>
            <li><strong>Blocks skipped:</strong> {weekly.blocksSkipped}</li>
          </ul>
          {weekly.scheduleInsights.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Scheduling feedback</p>
              <ul>
                {weekly.scheduleInsights.slice(0, 5).map((line) => (
                  <li key={line} style={{ fontSize: 14, marginBottom: 4 }}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Week approval status + quick approve */}
      <section className="sectionStack" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Week approvals</h2>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>
            {approvedCount} / {totalWeeks} weeks approved
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#2e7d32', borderRadius: 3, width: `${totalWeeks > 0 ? (approvedCount / totalWeeks) * 100 : 0}%`, transition: 'width 0.3s' }} />
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(weekNum => {
            const status = weekStatuses[weekNum] ?? 'draft';
            const isApproving = approvingWeek === weekNum;
            return (
              <div key={weekNum} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${status === 'approved' ? '#c8e6c9' : '#e0e0e0'}`,
                background: status === 'approved' ? '#f1f8e9' : '#fafafa',
              }}>
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
                    style={{
                      fontSize: 13, padding: '6px 14px', borderRadius: 999,
                      border: 'none', background: '#2e7d32', color: 'white',
                      fontWeight: 600, cursor: planId ? 'pointer' : 'not-allowed',
                      opacity: isApproving ? 0.7 : 1, minHeight: 36,
                    }}
                  >
                    {isApproving ? 'Approving…' : `Approve Week ${weekNum}`}
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: '#2e7d32' }}>Client can see this week ✓</span>
                )}
              </div>
            );
          })}
        </div>

        {approveError ? <p style={{ marginTop: 8, fontSize: 13, color: '#c62828' }}>{approveError}</p> : null}
        <p style={{ marginTop: 12, fontSize: 13, color: '#888' }}>
          To edit week content inline, use the{' '}
          <Link href="/provider/plans" style={{ color: '#555', textDecoration: 'underline' }}>plan queue</Link>.
        </p>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Daily read-out</h2>
        <CounselorReadOutEditor
          clientId={clientId}
          initialTitle={templateTitle}
          initialBody={templateBody}
        />
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Next week planning (AI)</h2>
        <p style={{ color: '#555', fontSize: 14 }}>
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
          <div style={{ marginTop: 16, padding: 16, border: '1px solid #e0e0e0', borderRadius: 12, background: '#fafafa' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
              Week {weekDraft.week}: {weekDraft.theme}
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: '#555' }}>{weekDraft.focus}</p>
            <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Read-out:</strong> {weekDraft.reinforcementTemplate?.title ?? '—'}</p>
            <p style={{ margin: '0 0 4px', fontSize: 13 }}><strong>Yoga:</strong> {weekDraft.yogaTrial?.principle ?? '—'}</p>
            <p style={{ margin: '0 0 12px', fontSize: 13 }}><strong>Music:</strong> {weekDraft.musicMoment?.playlist?.title ?? '—'}</p>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555' }}>
              Applying saves this draft. Then approve it from the week approvals section above to release it to the client.
            </p>
            <button type="button" onClick={() => void onApplyWeek()} disabled={applyingWeek}>
              {applyingWeek ? 'Applying…' : `Apply Week ${weekDraft.week} draft to plan`}
            </button>
          </div>
        ) : null}
      </section>

      {message ? (
        <p role="status" className="statusBanner" style={{ marginTop: 24 }}>
          {message}
        </p>
      ) : null}
    </>
  );
}

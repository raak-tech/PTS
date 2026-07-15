'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ClientRow = {
  id: string;
  label: string;
  phone: string | null;
  registered: string;
  planStatus: string;
  hasRedFlag: boolean;
  unreadCount: number;
  noteCount: number;
  needsAction: boolean;
  intakeTeaser?: string | null;
  formulationPending?: boolean;
};

type EngagementRow = {
  clientId: string;
  reinforcementRecordedToday: boolean;
  calendarBlocksDone: number;
  calendarBlocksTotal: number;
  holisticDone: number;
  holisticTotal: number;
  checkInDone: boolean;
  completionPct: number;
  assignedTaskCount: number;
};

type Caseload = {
  total: number;
  withTasks: number;
  completedToday: number;
  avgCompletionPct: number;
};

type EngagementStatus = 'loading' | 'ready' | 'unavailable';

export function ProviderClientsListClient({
  clients,
  actionCount,
  totalCount,
  filter,
}: {
  clients: ClientRow[];
  actionCount: number;
  totalCount: number;
  filter?: string | null;
}) {
  const [engagement, setEngagement] = useState<Record<string, EngagementRow>>({});
  const [caseload, setCaseload] = useState<Caseload | null>(null);
  const [engagementStatus, setEngagementStatus] = useState<EngagementStatus>('loading');
  const [genState, setGenState] = useState<
    Record<string, { status: 'idle' | 'generating' | 'done' | 'error'; message?: string }>
  >({});
  const [elapsed, setElapsed] = useState<Record<string, number>>({});

  useEffect(() => {
    const generatingId = Object.keys(genState).find((id) => genState[id]?.status === 'generating');
    if (!generatingId) return;
    const t = setInterval(() => {
      setElapsed((prev) => ({ ...prev, [generatingId]: (prev[generatingId] ?? 0) + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [genState]);

  const generateWeek1 = async (clientId: string) => {
    setElapsed((prev) => ({ ...prev, [clientId]: 0 }));
    setGenState((prev) => ({ ...prev, [clientId]: { status: 'generating' } }));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 320_000);
    try {
      const res = await fetch('/api/provider/generate-plan', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: clientId }),
        signal: controller.signal,
      });
      const data = (await res.json()) as { ok?: boolean; reason?: string };
      if (!res.ok || !data.ok) {
        if (data.reason === 'plan_exists') {
          setGenState((prev) => ({ ...prev, [clientId]: { status: 'done' } }));
          window.location.assign(`/provider/clients/${clientId}?tab=plan`);
          return;
        }
        if (data.reason === 'formulation_not_approved' || data.reason === 'formulation_missing') {
          setGenState((prev) => ({ ...prev, [clientId]: { status: 'done' } }));
          window.location.assign(`/provider/formulations/${clientId}`);
          return;
        }
        setGenState((prev) => ({
          ...prev,
          [clientId]: {
            status: 'error',
            message:
              data.reason === 'generation_failed'
                ? 'Generation failed — confirm intake is complete, then retry.'
                : data.reason === 'unauthorized'
                  ? 'Session expired — sign in with email, then retry.'
                  : (data.reason ?? 'Could not generate Week 1.'),
          },
        }));
        return;
      }
      setGenState((prev) => ({ ...prev, [clientId]: { status: 'done' } }));
      window.location.assign(`/provider/clients/${clientId}?tab=plan`);
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      setGenState((prev) => ({
        ...prev,
        [clientId]: {
          status: 'error',
          message: aborted
            ? 'Timed out after 5 min. Refresh in a moment — the draft may still finish.'
            : 'Network error — Week 1 not generated.',
        },
      }));
    } finally {
      clearTimeout(timer);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/provider/engagement', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          if (!cancelled) setEngagementStatus('unavailable');
          return null;
        }
        return r.json() as Promise<{ clients?: EngagementRow[]; caseload?: Caseload }>;
      })
      .then((data) => {
        if (cancelled || !data) return;
        const map: Record<string, EngagementRow> = {};
        for (const row of data.clients ?? []) {
          map[row.clientId] = row;
        }
        setEngagement(map);
        if (data.caseload) setCaseload(data.caseload);
        setEngagementStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setEngagementStatus('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered =
    filter === 'plans'
      ? clients.filter(
          (c) =>
            c.formulationPending ||
            c.planStatus === 'none' ||
            c.planStatus === 'pending_review' ||
            c.planStatus === 'draft' ||
            c.needsAction,
        )
      : clients;

  return (
    <>
      <h1 className="provider-page-title">Caseload</h1>
      <p className="provider-page-subtitle">
        {actionCount} need action · {totalCount} total
        {caseload && caseload.withTasks > 0
          ? ` · ${caseload.completedToday}/${caseload.withTasks} completed today (${caseload.avgCompletionPct}% avg)`
          : ''}
      </p>

      {filter === 'plans' ? (
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--muted)' }}>
          Showing clients needing plan action.{' '}
          <Link href="/provider/clients" style={{ fontWeight: 600 }}>
            Clear filter
          </Link>
        </p>
      ) : (
        <p style={{ margin: '0 0 16px', fontSize: 14 }}>
          <Link href="/provider/clients?filter=plans" style={{ fontWeight: 600 }}>
            Filter: awaiting plan action →
          </Link>
        </p>
      )}

      {filtered.length === 0 ? (
        <section className="provider-panel">
          <p style={{ margin: 0 }}>
            {filter === 'plans' ? 'No clients currently need plan action.' : 'No clients have registered yet.'}
          </p>
        </section>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((client) => {
            const e = engagement[client.id];
            const gen = genState[client.id];
            const onTrack =
              e && e.assignedTaskCount > 0 ? e.completionPct >= 80 : !client.needsAction;
            const chartHref = `/provider/clients/${client.id}?tab=plan`;

            return (
              <article key={client.id} className="provider-panel">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{client.label}</h2>
                    {client.phone ? (
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted)' }}>{client.phone}</p>
                    ) : null}
                    {client.intakeTeaser ? (
                      <p style={{ margin: '8px 0 0', fontSize: '0.875rem', lineHeight: 1.45, color: 'var(--foreground)' }}>
                        {client.intakeTeaser}
                      </p>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {client.hasRedFlag ? (
                      <Link
                        href={chartHref}
                        className="provider-tag provider-tag--danger provider-tag--link"
                      >
                        Red flags
                      </Link>
                    ) : null}
                    {client.formulationPending ? (
                      <Link
                        href={`/provider/formulations/${client.id}`}
                        className="provider-tag provider-tag--warn provider-tag--link"
                      >
                        Formulation
                      </Link>
                    ) : null}
                    {client.unreadCount > 0 ? (
                      <Link
                        href={`/provider/clients/${client.id}?tab=messages`}
                        className="provider-tag provider-tag--warn provider-tag--link"
                      >
                        {client.unreadCount} unread
                      </Link>
                    ) : null}
                    {client.noteCount > 0 ? (
                      <Link
                        href={`/provider/clients/${client.id}?tab=notes#admin-notes`}
                        className="provider-tag provider-tag--warn provider-tag--link"
                      >
                        {client.noteCount} admin note{client.noteCount !== 1 ? 's' : ''}
                      </Link>
                    ) : null}
                    {onTrack ? (
                      <span className="provider-tag provider-tag--ok">On track</span>
                    ) : (
                      <Link
                        href={`/provider/clients/${client.id}?tab=activity`}
                        className="provider-tag provider-tag--warn provider-tag--link"
                      >
                        Needs follow-up
                      </Link>
                    )}
                  </div>
                </div>

                <p style={{ margin: '8px 0 4px', color: 'var(--muted)', fontSize: '0.875rem' }}>
                  Registered {client.registered} · Plan: {client.planStatus}
                  {client.formulationPending ? ' · Formulation awaiting review' : ''}
                </p>

                {engagementStatus === 'loading' ? (
                  <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Loading today&apos;s progress…
                  </p>
                ) : engagementStatus === 'unavailable' ? (
                  <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Today&apos;s progress unavailable — open the chart to continue.
                  </p>
                ) : e ? (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 10,
                      fontSize: '0.8125rem',
                    }}
                  >
                    <span className="provider-tag">Check-in {e.checkInDone ? '✓' : '○'}</span>
                    <span className="provider-tag">
                      Read-out {e.reinforcementRecordedToday ? '✓' : '○'}
                    </span>
                    <span className="provider-tag">
                      Holistic {e.holisticDone}/{e.holisticTotal}
                    </span>
                    {e.calendarBlocksTotal > 0 ? (
                      <span className="provider-tag">
                        Calendar {e.calendarBlocksDone}/{e.calendarBlocksTotal}
                      </span>
                    ) : null}
                    {e.assignedTaskCount > 0 ? (
                      <span className="provider-tag provider-tag--ok">{e.completionPct}% today</span>
                    ) : (
                      <span className="provider-tag">No tasks assigned yet</span>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    No tasks assigned yet
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, alignItems: 'center' }}>
                  {client.formulationPending ? (
                    <Link href={`/provider/formulations/${client.id}`} className="actionLink">
                      Review formulation →
                    </Link>
                  ) : client.planStatus === 'none' ? (
                    <button
                      type="button"
                      disabled={gen?.status === 'generating'}
                      onClick={() => void generateWeek1(client.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 999,
                        border: 'none',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: gen?.status === 'generating' ? 'default' : 'pointer',
                        opacity: gen?.status === 'generating' ? 0.7 : 1,
                      }}
                    >
                      {gen?.status === 'generating'
                        ? `Generating Week 1… ${elapsed[client.id] ?? 0}s`
                        : gen?.status === 'error'
                          ? 'Retry Week 1 draft'
                          : 'Generate Week 1 draft'}
                    </button>
                  ) : client.planStatus === 'pending_review' || client.planStatus === 'draft' ? (
                    <Link href={chartHref} className="actionLink">
                      Review plan draft →
                    </Link>
                  ) : null}
                  <Link href={chartHref} className="actionLink secondary">
                    Open chart →
                  </Link>
                </div>
                {gen?.status === 'error' ? (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--danger)' }}>{gen.message}</p>
                ) : null}
                {gen?.status === 'done' ? (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--success)' }}>
                    Draft ready — opening chart…
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

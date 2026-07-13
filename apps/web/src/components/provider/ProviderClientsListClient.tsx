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

export function ProviderClientsListClient({
  clients,
  actionCount,
  totalCount,
}: {
  clients: ClientRow[];
  actionCount: number;
  totalCount: number;
}) {
  const [engagement, setEngagement] = useState<Record<string, EngagementRow>>({});
  const [caseload, setCaseload] = useState<Caseload | null>(null);

  useEffect(() => {
    void fetch('/api/provider/engagement', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { clients?: EngagementRow[]; caseload?: Caseload }) => {
        const map: Record<string, EngagementRow> = {};
        for (const row of data.clients ?? []) {
          map[row.clientId] = row;
        }
        setEngagement(map);
        if (data.caseload) setCaseload(data.caseload);
      })
      .catch(() => undefined);
  }, []);

  return (
    <>
      <h1 className="provider-page-title">Clients</h1>
      <p className="provider-page-subtitle">
        {actionCount} need action · {totalCount} total
        {caseload && caseload.withTasks > 0
          ? ` · ${caseload.completedToday}/${caseload.withTasks} completed today (${caseload.avgCompletionPct}% avg)`
          : ''}
      </p>

      {clients.length === 0 ? (
        <section className="provider-panel">
          <p style={{ margin: 0 }}>No clients have registered yet.</p>
        </section>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {clients.map((client) => {
            const e = engagement[client.id];
            const onTrack =
              e && e.assignedTaskCount > 0 ? e.completionPct >= 80 : !client.needsAction;

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
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {client.hasRedFlag ? (
                      <Link
                        href={`/provider/clients/${client.id}?tab=overview`}
                        className="provider-tag provider-tag--danger provider-tag--link"
                      >
                        Red flags
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
                        href={`/provider/clients/${client.id}?tab=overview#admin-notes`}
                        className="provider-tag provider-tag--warn provider-tag--link"
                      >
                        {client.noteCount} admin note{client.noteCount !== 1 ? 's' : ''}
                      </Link>
                    ) : null}
                    {onTrack ? (
                      <span className="provider-tag provider-tag--ok">On track</span>
                    ) : (
                      <Link
                        href={`/provider/clients/${client.id}?tab=overview`}
                        className="provider-tag provider-tag--warn provider-tag--link"
                      >
                        Needs follow-up
                      </Link>
                    )}
                  </div>
                </div>

                <p style={{ margin: '8px 0 4px', color: 'var(--muted)', fontSize: '0.875rem' }}>
                  Registered {client.registered} · Plan: {client.planStatus}
                </p>

                {e ? (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 10,
                      fontSize: '0.8125rem',
                    }}
                  >
                    <span className="provider-tag">
                      Check-in {e.checkInDone ? '✓' : '○'}
                    </span>
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
                    Loading today&apos;s progress…
                  </p>
                )}

                <Link
                  href={`/provider/clients/${client.id}`}
                  className="actionLink secondary"
                  style={{ marginTop: 12 }}
                >
                  Open workspace →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

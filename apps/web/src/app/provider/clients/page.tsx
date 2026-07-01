import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { getDb } from '@/db';
import { counselorNotes, intakeResponses, messages, plans, users } from '@/db/schema';
import { getUserFromCookieHeader } from '@/lib/session';

export const metadata: Metadata = { title: 'Clients | Counselor' };

type ClientRow = { id: string; email: string; displayName: string | null; phone: string | null; createdAt: Date };
type PlanRow = { userId: string; status: string; createdAt: Date };
type IntakeFlagRow = { userId: string; hasRedFlags: boolean; isSafe: boolean };
type UnreadRow = { fromUserId: string };
type NoteCountRow = { clientId: string };

export default async function ProviderClientsPage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  const db = getDb();

  const clients = (await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      phone: users.phone,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'client'))
    .orderBy(desc(users.createdAt))) as ClientRow[];

  const clientIds = clients.map((c) => c.id);

  const allPlans: PlanRow[] =
    clientIds.length > 0
      ? ((await db
          .select({ userId: plans.userId, status: plans.status, createdAt: plans.createdAt })
          .from(plans)) as PlanRow[])
      : [];
  const latestStatusByClient: Record<string, string> = {};
  for (const p of allPlans.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    latestStatusByClient[p.userId] = p.status;
  }

  const intakeFlags: IntakeFlagRow[] =
    clientIds.length > 0
      ? ((await db
          .select({ userId: intakeResponses.userId, hasRedFlags: intakeResponses.hasRedFlags, isSafe: intakeResponses.isSafe })
          .from(intakeResponses)) as IntakeFlagRow[])
      : [];
  const flagByClient = Object.fromEntries(intakeFlags.map((i) => [i.userId, i]));

  const unreadRows: UnreadRow[] = user
    ? ((await db
        .select({ fromUserId: messages.fromUserId })
        .from(messages)
        .where(and(eq(messages.toUserId, user.id), isNull(messages.readAt)))) as UnreadRow[])
    : [];
  const unreadByClient: Record<string, number> = {};
  for (const row of unreadRows) {
    unreadByClient[row.fromUserId] = (unreadByClient[row.fromUserId] ?? 0) + 1;
  }

  const noteRows: NoteCountRow[] =
    clientIds.length > 0
      ? ((await db
          .select({ clientId: counselorNotes.clientId })
          .from(counselorNotes)
          .where(isNull(counselorNotes.resolvedAt))) as NoteCountRow[])
      : [];
  const noteCountByClient: Record<string, number> = {};
  for (const row of noteRows) {
    noteCountByClient[row.clientId] = (noteCountByClient[row.clientId] ?? 0) + 1;
  }

  const enriched = clients.map((client) => {
    const hasRedFlag = Boolean(flagByClient[client.id]?.hasRedFlags) || flagByClient[client.id]?.isSafe === false;
    const unreadCount = unreadByClient[client.id] ?? 0;
    const noteCount = noteCountByClient[client.id] ?? 0;
    const planStatus = latestStatusByClient[client.id] ?? 'none';
    const needsAction = hasRedFlag || unreadCount > 0 || noteCount > 0;
    return { ...client, hasRedFlag, unreadCount, noteCount, planStatus, needsAction };
  });

  enriched.sort((a, b) => {
    if (a.needsAction !== b.needsAction) return a.needsAction ? -1 : 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const actionCount = enriched.filter((c) => c.needsAction).length;

  return (
    <>
      <h1 className="provider-page-title">Clients</h1>
      <p className="provider-page-subtitle">
        {actionCount} need action · {clients.length} total
      </p>

      {clients.length === 0 ? (
        <section className="provider-panel">
          <p style={{ margin: 0 }}>No clients have registered yet.</p>
        </section>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {enriched.map((client) => (
            <article key={client.id} className="provider-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '1.05rem' }}>{displayLabel(client)}</h2>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {client.hasRedFlag ? <span className="provider-tag provider-tag--danger">Red flags</span> : null}
                  {client.unreadCount > 0 ? (
                    <span className="provider-tag provider-tag--warn">{client.unreadCount} unread</span>
                  ) : null}
                  {client.noteCount > 0 ? (
                    <span className="provider-tag provider-tag--warn">
                      {client.noteCount} admin note{client.noteCount !== 1 ? 's' : ''}
                    </span>
                  ) : null}
                  {!client.needsAction ? <span className="provider-tag provider-tag--ok">On track</span> : null}
                </div>
              </div>
              <p style={{ margin: '0 0 4px', color: 'var(--muted)', fontSize: '0.875rem' }}>
                Registered {client.createdAt.toLocaleDateString()} · Plan: {client.planStatus}
              </p>
              <Link href={`/provider/clients/${client.id}`} className="actionLink secondary" style={{ marginTop: 12 }}>
                Open workspace →
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function displayLabel(client: { displayName: string | null; phone: string | null; email: string }) {
  if (client.displayName) return client.displayName;
  if (client.phone) return client.phone.replace('+91', '+91 ');
  const [local, domain] = client.email.split('@');
  return domain === 'phone.pts.local' ? `+${local.replace(/^91/, '91 ')}` : `${local[0]}***@${domain}`;
}

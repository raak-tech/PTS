import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { getDb } from '@/db';
import { counselorNotes, intakeResponses, messages, plans, users } from '@/db/schema';
import { getClientCounselorMap, isClientVisibleToProvider } from '@/lib/client-access';
import { formatClientLabel } from '@/lib/provider-display';
import { getUserFromCookieHeader } from '@/lib/session';
import { ProviderClientsListClient } from '@/components/provider/ProviderClientsListClient';

export const metadata: Metadata = { title: 'Clients | Counselor' };

export default async function ProviderClientsPage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login/mobile?next=/provider/clients');

  const db = getDb();
  const assignmentMap = user ? await getClientCounselorMap() : {};

  const clients: {
    id: string;
    email: string;
    displayName: string | null;
    phone: string | null;
    createdAt: Date;
  }[] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      phone: users.phone,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'client'))
    .orderBy(desc(users.createdAt));

  const visibleClients = user
    ? clients.filter((c) => isClientVisibleToProvider(c.id, user.id, assignmentMap))
    : clients;

  const clientIds = visibleClients.map((c) => c.id);

  const allPlans: { userId: string; status: string; createdAt: Date }[] =
    clientIds.length > 0
      ? await db.select({ userId: plans.userId, status: plans.status, createdAt: plans.createdAt }).from(plans)
      : [];
  const latestStatusByClient: Record<string, string> = {};
  for (const p of allPlans.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    latestStatusByClient[p.userId] = p.status;
  }

  const intakeFlags: {
    userId: string;
    hasRedFlags: boolean;
    isSafe: boolean;
  }[] =
    clientIds.length > 0
      ? await db
          .select({
            userId: intakeResponses.userId,
            hasRedFlags: intakeResponses.hasRedFlags,
            isSafe: intakeResponses.isSafe,
          })
          .from(intakeResponses)
      : [];
  const flagByClient = Object.fromEntries(intakeFlags.map((i) => [i.userId, i]));

  const unreadRows = user
    ? await db
        .select({ fromUserId: messages.fromUserId })
        .from(messages)
        .where(and(eq(messages.toUserId, user.id), isNull(messages.readAt)))
    : [];
  const unreadByClient: Record<string, number> = {};
  for (const row of unreadRows) {
    unreadByClient[row.fromUserId] = (unreadByClient[row.fromUserId] ?? 0) + 1;
  }

  const noteRows =
    clientIds.length > 0
      ? await db
          .select({ clientId: counselorNotes.clientId })
          .from(counselorNotes)
          .where(isNull(counselorNotes.resolvedAt))
      : [];
  const noteCountByClient: Record<string, number> = {};
  for (const row of noteRows) {
    noteCountByClient[row.clientId] = (noteCountByClient[row.clientId] ?? 0) + 1;
  }

  const rows = visibleClients.map((client) => {
    const hasRedFlag = Boolean(flagByClient[client.id]?.hasRedFlags) || flagByClient[client.id]?.isSafe === false;
    const unreadCount = unreadByClient[client.id] ?? 0;
    const noteCount = noteCountByClient[client.id] ?? 0;
    const planStatus = latestStatusByClient[client.id] ?? 'none';
    const needsAction = hasRedFlag || unreadCount > 0 || noteCount > 0;
    return {
      id: client.id,
      label: formatClientLabel(client),
      phone: client.phone,
      registered: client.createdAt.toLocaleDateString(),
      planStatus,
      hasRedFlag,
      unreadCount,
      noteCount,
      needsAction,
    };
  });

  rows.sort((a, b) => {
    if (a.needsAction !== b.needsAction) return a.needsAction ? -1 : 1;
    return 0;
  });

  const actionCount = rows.filter((c) => c.needsAction).length;

  return (
    <ProviderClientsListClient
      clients={rows}
      actionCount={actionCount}
      totalCount={rows.length}
    />
  );
}

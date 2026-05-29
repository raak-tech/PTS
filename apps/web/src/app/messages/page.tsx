import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, ne, or } from 'drizzle-orm';

import { getDb } from '../../db';
import { clientCounselor, messages, users } from '../../db/schema';
import { getUserFromCookieHeader } from '../../lib/session';
import { MessagesClient } from './MessagesClient';

export const metadata: Metadata = { title: 'Messages | PTS' };

export default async function MessagesPage({ searchParams }: { searchParams?: Promise<{ with?: string }> }) {
  const headersList = await headers();
  const user = await getUserFromCookieHeader(headersList.get('cookie'));
  if (!user) redirect('/login?next=/messages');

  const params = (await Promise.resolve(searchParams ?? {})) as Record<string, string | undefined>;
  const preselectedId = params['with'];

  const db = getDb();
  type ContactRow = { id: string; email: string; role: string; displayName: string | null };

  // Find all users this person has already exchanged messages with
  const messaged = (await db
    .selectDistinct({ id: users.id, email: users.email, role: users.role, displayName: users.displayName })
    .from(users)
    .innerJoin(
      messages,
      or(
        and(eq(messages.fromUserId, user.id), eq(messages.toUserId, users.id)),
        and(eq(messages.toUserId, user.id), eq(messages.fromUserId, users.id)),
      ),
    )
    .where(ne(users.id, user.id))) as ContactRow[];

  const messagedIds = new Set(messaged.map(c => c.id));
  let allContacts: ContactRow[] = [...messaged];

  if (user.role === 'client') {
    // Always surface the assigned counselor even if no messages yet
    const [assignment] = await db
      .select({ counselorId: clientCounselor.counselorId })
      .from(clientCounselor)
      .where(eq(clientCounselor.clientId, user.id))
      .limit(1);

    if (assignment && !messagedIds.has(assignment.counselorId)) {
      const [counselor] = (await db
        .select({ id: users.id, email: users.email, role: users.role, displayName: users.displayName })
        .from(users)
        .where(eq(users.id, assignment.counselorId))
        .limit(1)) as ContactRow[];
      if (counselor) allContacts = [counselor, ...allContacts];
    }
  } else {
    // Counselor: surface all clients assigned to them
    const assignments = await db
      .select({ clientId: clientCounselor.clientId })
      .from(clientCounselor)
      .where(eq(clientCounselor.counselorId, user.id));

    for (const a of assignments) {
      if (!messagedIds.has(a.clientId)) {
        const [client] = (await db
          .select({ id: users.id, email: users.email, role: users.role, displayName: users.displayName })
          .from(users)
          .where(eq(users.id, a.clientId))
          .limit(1)) as ContactRow[];
        if (client) allContacts = [...allContacts, client];
      }
    }
  }

  // If ?with= in URL adds someone not yet in the list
  if (preselectedId && !allContacts.find(c => c.id === preselectedId)) {
    const [extra] = (await db
      .select({ id: users.id, email: users.email, role: users.role, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, preselectedId))
      .limit(1)) as ContactRow[];
    if (extra) allContacts = [extra, ...allContacts];
  }

  return (
    <MessagesClient
      currentUserId={user.id}
      currentUserRole={user.role}
      contacts={allContacts}
      hasContacts={allContacts.length > 0}
      preselectedId={preselectedId}
    />
  );
}

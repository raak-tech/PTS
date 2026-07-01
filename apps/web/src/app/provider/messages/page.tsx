import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { and, eq, ne, or } from 'drizzle-orm';

import { getDb } from '@/db';
import { clientCounselor, counselorProfiles, messages, users } from '@/db/schema';
import { getUserFromCookieHeader } from '@/lib/session';
import { MessagesClient } from '@/app/messages/MessagesClient';

export const metadata: Metadata = { title: 'Messages | Counselor' };

export default async function ProviderMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ with?: string }>;
}) {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  const params = (await Promise.resolve(searchParams ?? {})) as Record<string, string | undefined>;
  const preselectedId = params['with'];

  const db = getDb();
  type ContactRow = {
    id: string;
    email: string;
    role: string;
    displayName: string | null;
    calendlyUrl?: string | null;
  };

  const messaged = (await db
    .selectDistinct({ id: users.id, email: users.email, role: users.role, displayName: users.displayName })
    .from(users)
    .innerJoin(
      messages,
      or(
        and(eq(messages.fromUserId, user!.id), eq(messages.toUserId, users.id)),
        and(eq(messages.toUserId, user!.id), eq(messages.fromUserId, users.id)),
      ),
    )
    .where(ne(users.id, user!.id))) as ContactRow[];

  const messagedIds = new Set(messaged.map((c) => c.id));
  let allContacts: ContactRow[] = [...messaged];

  const assignments = await db
    .select({ clientId: clientCounselor.clientId })
    .from(clientCounselor)
    .where(eq(clientCounselor.counselorId, user!.id));

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

  if (preselectedId && !allContacts.find((c) => c.id === preselectedId)) {
    const [extra] = (await db
      .select({ id: users.id, email: users.email, role: users.role, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, preselectedId))
      .limit(1)) as ContactRow[];
    if (extra) allContacts = [extra, ...allContacts];
  }

  return (
    <>
      <h1 className="provider-page-title">Messages</h1>
      <p className="provider-page-subtitle">Secure threads with your assigned clients.</p>
      <MessagesClient
        currentUserId={user!.id}
        currentUserRole={user!.role}
        contacts={allContacts}
        hasContacts={allContacts.length > 0}
        preselectedId={preselectedId}
      />
    </>
  );
}

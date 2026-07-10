import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, ne, or } from 'drizzle-orm';

import { getDb } from '@/db';
import { clientCounselor, messages, users } from '@/db/schema';
import { formatClientLabel } from '@/lib/provider-display';
import { isPilotPiiVisible } from '@/lib/pii';
import { getUserFromCookieHeader } from '@/lib/session';
import { MessagesClient } from '@/app/messages/MessagesClient';

export const metadata: Metadata = { title: 'Messages | Counselor' };

export default async function ProviderMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ with?: string }>;
}) {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user || user.role !== 'provider') {
    redirect('/login/mobile?next=/provider/clients');
  }

  const params = await searchParams;
  const preselectedId = params?.with;

  const db = getDb();
  type ContactRow = {
    id: string;
    email: string;
    role: string;
    displayName: string | null;
    phone: string | null;
  };

  const messaged = (await db
    .selectDistinct({
      id: users.id,
      email: users.email,
      role: users.role,
      displayName: users.displayName,
      phone: users.phone,
    })
    .from(users)
    .innerJoin(
      messages,
      or(
        and(eq(messages.fromUserId, user.id), eq(messages.toUserId, users.id)),
        and(eq(messages.toUserId, user.id), eq(messages.fromUserId, users.id)),
      ),
    )
    .where(ne(users.id, user.id))) as ContactRow[];

  const messagedIds = new Set(messaged.map((c) => c.id));
  let allContacts: ContactRow[] = [...messaged];

  const assignments = await db
    .select({ clientId: clientCounselor.clientId })
    .from(clientCounselor)
    .where(eq(clientCounselor.counselorId, user.id));

  for (const a of assignments) {
    if (!messagedIds.has(a.clientId)) {
      const [client] = (await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          displayName: users.displayName,
          phone: users.phone,
        })
        .from(users)
        .where(eq(users.id, a.clientId))
        .limit(1)) as ContactRow[];
      if (client) allContacts = [...allContacts, client];
    }
  }

  if (preselectedId && !allContacts.find((c) => c.id === preselectedId)) {
    const [extra] = (await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        displayName: users.displayName,
        phone: users.phone,
      })
      .from(users)
      .where(and(eq(users.id, preselectedId), eq(users.role, 'client')))
      .limit(1)) as ContactRow[];
    if (extra) allContacts = [extra, ...allContacts];
  }

  const contacts = allContacts.map((c) => ({
    id: c.id,
    email: c.email,
    role: c.role,
    displayName: formatClientLabel(c),
  }));

  return (
    <>
      <h1 className="provider-page-title">Messages</h1>
      <p className="provider-page-subtitle">Secure threads with your clients.</p>
      <MessagesClient
        currentUserId={user.id}
        contacts={contacts}
        hasContacts={contacts.length > 0}
        preselectedId={preselectedId}
        showFullPii={isPilotPiiVisible()}
      />
    </>
  );
}

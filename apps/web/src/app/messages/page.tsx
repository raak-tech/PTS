import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, ne, or } from 'drizzle-orm';

import { getDb } from '../../db';
import { messages, users } from '../../db/schema';
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

  // Find all users this person has exchanged messages with
  type ContactRow = { id: string; email: string; role: string };
  const contacts = (await db
    .selectDistinct({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .innerJoin(
      messages,
      or(
        and(eq(messages.fromUserId, user.id), eq(messages.toUserId, users.id)),
        and(eq(messages.toUserId, user.id), eq(messages.fromUserId, users.id)),
      ),
    )
    .where(ne(users.id, user.id))) as ContactRow[];

  // For clients with no contacts yet, show a counselor placeholder so the UI isn't blank
  const hasContacts = contacts.length > 0;

  // If ?with=userId is in the URL and not already in contacts, fetch that user and add them
  let allContacts = contacts;
  if (preselectedId && !contacts.find(c => c.id === preselectedId)) {
    const [extra] = (await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, preselectedId))
      .limit(1)) as ContactRow[];
    if (extra) allContacts = [extra, ...contacts];
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

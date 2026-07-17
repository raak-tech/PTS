import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { getUserFromCookieHeader } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';
import { headers } from 'next/headers';

import { FormulationReviewClient } from './FormulationReviewClient';

type PageProps = { params: Promise<{ userId: string }> };

export default async function FormulationReviewPage({ params }: PageProps) {
  const headersList = await headers();
  const user = await getUserFromCookieHeader(headersList.get('cookie'));
  if (!user || !canAccessProviderConsole(user)) {
    notFound();
  }

  const { userId } = await params;
  const db = getDb();
  const [client] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!client) notFound();

  return <FormulationReviewClient userId={userId} clientEmail={client.email} />;
}

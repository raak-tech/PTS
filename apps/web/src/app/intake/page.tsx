import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeResponses } from '@/db/schema';
import { getUserFromCookieHeader } from '@/lib/session';
import { IntakeClient } from '../IntakeClient';

export const metadata: Metadata = {
  title: 'Your assessment',
};

export default async function IntakePage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));

  if (!user) {
    redirect('/login/mobile?next=/intake');
  }

  if (user.role === 'provider') redirect('/provider');
  if (user.role === 'admin') redirect('/admin');

  const db = getDb();
  const [existing] = await db
    .select({ completedAt: intakeResponses.completedAt })
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, user.id))
    .limit(1);

  if (existing?.completedAt) redirect('/plan');

  return <IntakeClient />;
}

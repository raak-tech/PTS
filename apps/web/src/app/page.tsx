import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { getDb } from '../db';
import { intakeResponses } from '../db/schema';
import { getUserFromCookieHeader } from '../lib/session';
import { IntakeClient } from './IntakeClient';
import { LandingPage } from './LandingPage';

export const metadata: Metadata = {
  title: { absolute: 'Pain to Strength | PTS' },
  description: 'A counseling-led recovery program for anyone whose pain — from injury, accident, work, or sport — has changed how they live. Get back to the life you had.',
};

export default async function HomePage() {
  const headersList = await headers();
  const user = await getUserFromCookieHeader(headersList.get('cookie'));

  // Not logged in — show the landing page
  if (!user) return <LandingPage />;

  // Logged in — check if they've already completed intake
  const db = getDb();
  const [existing] = await db
    .select({ completedAt: intakeResponses.completedAt })
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, user.id))
    .limit(1);

  if (existing?.completedAt) {
    redirect('/plan');
  }

  // Logged in, no intake yet — show the intake form
  return <IntakeClient />;
}

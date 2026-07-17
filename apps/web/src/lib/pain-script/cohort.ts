import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import type { PilotCohort } from '@/lib/pain-script/types';

export async function getUserPilotCohort(userId: string): Promise<PilotCohort> {
  const db = getDb();
  const [row] = await db
    .select({ pilotCohort: users.pilotCohort })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const cohort = row?.pilotCohort;
  if (cohort === 'pain_script') return 'pain_script';
  return 'legacy';
}

export async function assignPilotCohortIfUnset(
  userId: string,
  cohort: PilotCohort,
): Promise<PilotCohort> {
  const current = await getUserPilotCohort(userId);
  if (current === 'pain_script') return 'pain_script';
  if (cohort === 'pain_script') {
    const db = getDb();
    await db.update(users).set({ pilotCohort: 'pain_script' }).where(eq(users.id, userId));
    return 'pain_script';
  }
  return current;
}

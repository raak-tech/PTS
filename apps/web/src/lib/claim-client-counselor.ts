import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { clientCounselor } from '@/db/schema';

/**
 * First counselor to act on a client claims them exclusively.
 * No-op if already mapped (does not steal assignment).
 */
export async function claimClientCounselor(
  clientId: string,
  counselorId: string,
  assignedAt: Date = new Date(),
): Promise<boolean> {
  const db = getDb();
  const [existing] = await db
    .select({ clientId: clientCounselor.clientId })
    .from(clientCounselor)
    .where(eq(clientCounselor.clientId, clientId))
    .limit(1);

  if (existing) return false;

  await db
    .insert(clientCounselor)
    .values({ clientId, counselorId, assignedAt })
    .onConflictDoNothing();

  return true;
}

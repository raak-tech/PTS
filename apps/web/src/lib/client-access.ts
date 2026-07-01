import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { clientCounselor, users } from '@/db/schema';

export async function getAssignedCounselorId(clientId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ counselorId: clientCounselor.counselorId })
    .from(clientCounselor)
    .where(eq(clientCounselor.clientId, clientId))
    .limit(1);
  return row?.counselorId ?? null;
}

/** Strict assignment check (messages, sensitive writes). */
export async function assertCounselorForClient(counselorId: string, clientId: string): Promise<boolean> {
  const assigned = await getAssignedCounselorId(clientId);
  return assigned === counselorId;
}

/** Pilot: any provider may view/act on registered clients in the counselor console. */
export async function assertProviderCanAccessClient(
  providerId: string,
  clientId: string,
): Promise<boolean> {
  const db = getDb();
  const [provider] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, providerId))
    .limit(1);
  if (provider?.role !== 'provider') return false;

  const [client] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, clientId))
    .limit(1);
  return client?.role === 'client';
}

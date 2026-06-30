import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { clientCounselor } from '@/db/schema';

export async function getAssignedCounselorId(clientId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ counselorId: clientCounselor.counselorId })
    .from(clientCounselor)
    .where(eq(clientCounselor.clientId, clientId))
    .limit(1);
  return row?.counselorId ?? null;
}

export async function assertCounselorForClient(counselorId: string, clientId: string): Promise<boolean> {
  const assigned = await getAssignedCounselorId(clientId);
  return assigned === counselorId;
}

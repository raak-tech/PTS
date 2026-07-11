import { eq } from 'drizzle-orm';

import { isAdminUser } from '@/lib/admin';

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

/** Map of clientId -> counselorId for all assignments. */
export async function getClientCounselorMap(): Promise<Record<string, string>> {
  const db = getDb();
  const rows = await db
    .select({ clientId: clientCounselor.clientId, counselorId: clientCounselor.counselorId })
    .from(clientCounselor);
  return Object.fromEntries(rows.map((r: { clientId: string; counselorId: string }) => [r.clientId, r.counselorId]));
}

/** Client is visible if unclaimed or assigned to this provider. */
export function isClientVisibleToProvider(
  clientId: string,
  providerId: string,
  assignmentMap: Record<string, string>,
): boolean {
  const assigned = assignmentMap[clientId];
  return !assigned || assigned === providerId;
}

export async function getVisibleClientIdsForProvider(providerId: string): Promise<string[]> {
  const db = getDb();
  const [allClients, assignmentMap] = await Promise.all([
    db.select({ id: users.id }).from(users).where(eq(users.role, 'client')),
    getClientCounselorMap(),
  ]);
  return allClients
    .filter((c: { id: string }) => isClientVisibleToProvider(c.id, providerId, assignmentMap))
    .map((c: { id: string }) => c.id);
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
  const [actor] = await db
    .select({ role: users.role, email: users.email })
    .from(users)
    .where(eq(users.id, providerId))
    .limit(1);
  if (!actor) return false;
  if (actor.role === 'admin' || isAdminUser(actor)) return true;

  if (actor.role !== 'provider') return false;

  const [client] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, clientId))
    .limit(1);
  return client?.role === 'client';
}

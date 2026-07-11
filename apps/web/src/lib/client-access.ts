import { eq } from 'drizzle-orm';

import { isAdminUser } from '@/lib/admin';

import { getDb } from '@/db';
import { clientCounselor, users } from '@/db/schema';

type AccessUser = { id: string; role: string; email: string };

async function loadAccessActor(userId: string): Promise<AccessUser | null> {
  const db = getDb();
  const [actor] = (await db
    .select({ id: users.id, role: users.role, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)) as AccessUser[];
  return actor ?? null;
}

function isConsoleAdmin(actor: AccessUser): boolean {
  return actor.role === 'admin' || isAdminUser(actor);
}

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

/**
 * Provider may view/act on clients that are unassigned (pickup) or assigned to them.
 * Admins bypass assignment rules.
 */
export async function assertProviderCanAccessClient(
  providerId: string,
  clientId: string,
): Promise<boolean> {
  const actor = await loadAccessActor(providerId);
  if (!actor) return false;
  if (isConsoleAdmin(actor)) return true;
  if (actor.role !== 'provider') return false;

  const db = getDb();
  const [client] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, clientId))
    .limit(1);
  if (client?.role !== 'client') return false;

  const assignmentMap = await getClientCounselorMap();
  return isClientVisibleToProvider(clientId, providerId, assignmentMap);
}

/** Strict assignment check for assigned-client operations (messages on active caseload, notes, etc.). */
export async function assertCounselorForClient(counselorId: string, clientId: string): Promise<boolean> {
  const actor = await loadAccessActor(counselorId);
  if (!actor) return false;
  if (isConsoleAdmin(actor)) return true;

  const assigned = await getAssignedCounselorId(clientId);
  return assigned === counselorId;
}

/** Provider/admin may open a message thread with this client. */
export async function assertMessageAccess(actorId: string, otherUserId: string): Promise<boolean> {
  const [actor, other] = await Promise.all([loadAccessActor(actorId), loadAccessActor(otherUserId)]);
  if (!actor || !other) return false;

  if (actor.role === 'client' && other.role === 'provider') {
    return true;
  }

  if ((actor.role === 'provider' || isConsoleAdmin(actor)) && other.role === 'client') {
    return assertProviderCanAccessClient(actor.id, other.id);
  }

  if (isConsoleAdmin(actor)) return true;

  return actor.id === other.id;
}

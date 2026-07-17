import { eq } from 'drizzle-orm';

import { isAdminUser } from '@/lib/admin';

import { getDb } from '@/db';
import { clientCounselor, intakeResponses, users } from '@/db/schema';

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

/** Set of client userIds with a completed intake row. */
export async function getCompletedIntakeClientIds(): Promise<Set<string>> {
  const db = getDb();
  const rows = await db.select({ userId: intakeResponses.userId }).from(intakeResponses);
  return new Set(rows.map((r) => r.userId));
}

export async function hasCompletedIntake(clientId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ userId: intakeResponses.userId })
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, clientId))
    .limit(1);
  return Boolean(row);
}

/**
 * Hybrid ready-pool visibility:
 * - Assigned → only that counselor
 * - Unassigned → only after completed intake (ready for Week 1 / claim)
 * Pass `completedIntakeIds` for caseload lists.
 */
export function isClientVisibleToProvider(
  clientId: string,
  providerId: string,
  assignmentMap: Record<string, string>,
  completedIntakeIds?: Set<string>,
): boolean {
  const assigned = assignmentMap[clientId];
  if (assigned) return assigned === providerId;
  if (completedIntakeIds) return completedIntakeIds.has(clientId);
  // Without an intake set, treat unassigned as not on the ready pool (safe default).
  return false;
}

export async function getVisibleClientIdsForProvider(providerId: string): Promise<string[]> {
  const db = getDb();
  const [allClients, assignmentMap, completedIntakeIds] = await Promise.all([
    db.select({ id: users.id }).from(users).where(eq(users.role, 'client')),
    getClientCounselorMap(),
    getCompletedIntakeClientIds(),
  ]);
  return allClients
    .filter((c: { id: string }) =>
      isClientVisibleToProvider(c.id, providerId, assignmentMap, completedIntakeIds),
    )
    .map((c: { id: string }) => c.id);
}

/**
 * Provider may view/act on ready-pool (completed intake, unassigned) or own assigned clients.
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

  const [assignmentMap, completedIntakeIds] = await Promise.all([
    getClientCounselorMap(),
    getCompletedIntakeClientIds(),
  ]);
  return isClientVisibleToProvider(clientId, providerId, assignmentMap, completedIntakeIds);
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

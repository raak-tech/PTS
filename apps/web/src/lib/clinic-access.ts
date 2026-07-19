import { and, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { clinicMemberships, clinics, users } from '@/db/schema';
import { getUserFromRequest } from '@/lib/session';

export type ClinicMembershipRole = 'referrer' | 'clinic_admin';

export type ClinicActor = {
  userId: string;
  userRole: string;
  clinicId: string;
  clinicSlug: string;
  clinicName: string;
  membershipRole: ClinicMembershipRole;
};

/**
 * Clinic membership is the authorization boundary. `users.role='referrer'`
 * enables web login/routing, but never grants access without an active clinic
 * membership.
 */
export async function getClinicActor(userId: string): Promise<ClinicActor | null> {
  const db = getDb();
  const rows = await db
    .select({
      userId: users.id,
      userRole: users.role,
      clinicId: clinics.id,
      clinicSlug: clinics.slug,
      clinicName: clinics.name,
      membershipRole: clinicMemberships.role,
    })
    .from(clinicMemberships)
    .innerJoin(users, eq(users.id, clinicMemberships.userId))
    .innerJoin(clinics, eq(clinics.id, clinicMemberships.clinicId))
    .where(and(eq(clinicMemberships.userId, userId), eq(clinics.status, 'active')))
    .limit(1);

  const actor = rows[0];
  if (!actor) return null;
  if (actor.userRole !== 'referrer' && actor.userRole !== 'admin') return null;
  if (actor.membershipRole !== 'referrer' && actor.membershipRole !== 'clinic_admin') {
    return null;
  }

  return {
    ...actor,
    membershipRole: actor.membershipRole,
  };
}

export function canViewClinicAggregate(actor: ClinicActor): boolean {
  return actor.membershipRole === 'clinic_admin';
}

/** Resolve the clinic actor for an authenticated request, or null if none. */
export async function requireClinicActor(request: Request): Promise<ClinicActor | null> {
  const user = await getUserFromRequest(request);
  if (!user) return null;
  return getClinicActor(user.id);
}

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { clinicMemberships, users } from '@/db/schema';
import { recordAudit } from '@/lib/audit';
import { requireClinicActor } from '@/lib/clinic-access';
import { buildClinicPatientRows } from '@/lib/clinic-projection';
import { logError } from '@/lib/logger';

/**
 * Clinic-scoped patient projection (Run 3). Whitelisted fields only — never
 * messages, notes, reflections, read-out content, safety detail, or plan
 * content. A referrer sees only patients they enrolled; clinic_admin sees the
 * whole clinic. Every read is audited.
 */
export async function GET(request: Request) {
  try {
    const actor = await requireClinicActor(request);
    if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const patients = await buildClinicPatientRows(actor);

    // Clinic admins can reassign patients to any referrer in the clinic.
    let referrers: { userId: string; displayName: string | null }[] = [];
    if (actor.membershipRole === 'clinic_admin') {
      const db = getDb();
      referrers = await db
        .select({ userId: clinicMemberships.userId, displayName: users.displayName })
        .from(clinicMemberships)
        .innerJoin(users, eq(users.id, clinicMemberships.userId))
        .where(
          and(eq(clinicMemberships.clinicId, actor.clinicId), eq(clinicMemberships.role, 'referrer')),
        );
    }

    void recordAudit({
      actorUserId: actor.userId,
      actorRole: `clinic_${actor.membershipRole}`,
      action: 'clinic_patients_viewed',
      targetType: 'clinic',
      targetId: actor.clinicId,
      metadata: { count: patients.length },
    });

    return NextResponse.json({
      ok: true,
      clinic: { id: actor.clinicId, name: actor.clinicName, slug: actor.clinicSlug },
      role: actor.membershipRole,
      referrers,
      patients,
    });
  } catch (err) {
    logError('clinic_patients_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

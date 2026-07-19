import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { clinicEnrollmentCodes } from '@/db/schema';
import { recordAudit } from '@/lib/audit';
import { requireClinicActor } from '@/lib/clinic-access';
import { logError } from '@/lib/logger';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Revoke an enrollment code (Run 3 management). Revocation sets the expiry into
 * the past so the code can no longer be redeemed, while preserving the row for
 * audit and keeping any already-completed enrollments intact. A referrer may
 * revoke only codes they created; clinic_admin may revoke any clinic code.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireClinicActor(request);
    if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const db = getDb();
    const [code] = await db
      .select({ id: clinicEnrollmentCodes.id, clinicId: clinicEnrollmentCodes.clinicId, createdByUserId: clinicEnrollmentCodes.createdByUserId })
      .from(clinicEnrollmentCodes)
      .where(and(eq(clinicEnrollmentCodes.id, id), eq(clinicEnrollmentCodes.clinicId, actor.clinicId)))
      .limit(1);
    if (!code) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    if (actor.membershipRole === 'referrer' && code.createdByUserId !== actor.userId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    await db
      .update(clinicEnrollmentCodes)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(clinicEnrollmentCodes.id, id));

    void recordAudit({
      actorUserId: actor.userId,
      actorRole: `clinic_${actor.membershipRole}`,
      action: 'clinic_enrollment_code_revoked',
      targetType: 'clinic_enrollment_code',
      targetId: id,
      metadata: {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('clinic_codes_delete_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

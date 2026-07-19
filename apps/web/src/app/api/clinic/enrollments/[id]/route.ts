import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { clinicEnrollments, clinicMemberships } from '@/db/schema';
import { recordAudit } from '@/lib/audit';
import { requireClinicActor } from '@/lib/clinic-access';
import { logError } from '@/lib/logger';

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z
  .object({
    status: z.enum(['enrolled', 'active', 'graduated', 'withdrawn']).optional(),
    referrerUserId: z.string().trim().min(1).nullable().optional(),
  })
  .refine((v) => v.status !== undefined || v.referrerUserId !== undefined, {
    message: 'nothing_to_update',
  });

/**
 * Update a clinic enrollment's lifecycle (Run 2/3 management). A referrer may
 * only manage their own attributed patients; a clinic_admin may manage any
 * patient in the clinic and reassign the referrer.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireClinicActor(request);
    if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

    const db = getDb();
    const [enrollment] = await db
      .select({
        id: clinicEnrollments.id,
        clinicId: clinicEnrollments.clinicId,
        referrerUserId: clinicEnrollments.referrerUserId,
        firstActiveAt: clinicEnrollments.firstActiveAt,
      })
      .from(clinicEnrollments)
      .where(eq(clinicEnrollments.id, id))
      .limit(1);
    if (!enrollment || enrollment.clinicId !== actor.clinicId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (actor.membershipRole === 'referrer' && enrollment.referrerUserId !== actor.userId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Only clinic_admin may reassign the referrer.
    if (parsed.data.referrerUserId !== undefined && actor.membershipRole !== 'clinic_admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const now = new Date();
    const patch: Record<string, unknown> = { updatedAt: now };

    if (parsed.data.status !== undefined) {
      patch.status = parsed.data.status;
      if (parsed.data.status === 'active' && !enrollment.firstActiveAt) {
        patch.firstActiveAt = now;
      }
    }

    if (parsed.data.referrerUserId !== undefined) {
      const newReferrer = parsed.data.referrerUserId;
      if (newReferrer) {
        const [membership] = await db
          .select({ id: clinicMemberships.id })
          .from(clinicMemberships)
          .where(and(eq(clinicMemberships.clinicId, actor.clinicId), eq(clinicMemberships.userId, newReferrer)))
          .limit(1);
        if (!membership) return NextResponse.json({ error: 'invalid_referrer' }, { status: 400 });
      }
      patch.referrerUserId = newReferrer;
    }

    await db.update(clinicEnrollments).set(patch).where(eq(clinicEnrollments.id, id));

    void recordAudit({
      actorUserId: actor.userId,
      actorRole: `clinic_${actor.membershipRole}`,
      action: 'clinic_enrollment_updated',
      targetType: 'clinic_enrollment',
      targetId: id,
      metadata: { status: parsed.data.status, referrerUserId: parsed.data.referrerUserId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('clinic_enrollment_update_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

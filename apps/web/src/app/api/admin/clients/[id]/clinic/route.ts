import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { clinicEnrollments, clinics, users } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { recordAudit } from '@/lib/audit';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  clinicId: z.string().trim().min(1),
  referrerUserId: z.string().trim().min(1).nullable().optional(),
  cohortLabel: z.string().trim().min(1).max(120).nullable().optional(),
});

/**
 * Admin attach fallback (Run 2). Creates clinic attribution for an existing
 * client. Sharing consent is NOT granted here — only the patient can consent
 * in-app, so the clinic sees the patient only after they opt in.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id: clientId } = await context.params;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

    const db = getDb();
    const [client] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, clientId))
      .limit(1);
    if (!client || client.role !== 'client') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const [clinic] = await db
      .select({ id: clinics.id })
      .from(clinics)
      .where(eq(clinics.id, parsed.data.clinicId))
      .limit(1);
    if (!clinic) return NextResponse.json({ error: 'invalid_clinic' }, { status: 400 });

    const referrerUserId = parsed.data.referrerUserId ?? null;
    const cohortLabel = parsed.data.cohortLabel ?? null;
    const now = new Date();

    const [existing] = await db
      .select({ id: clinicEnrollments.id })
      .from(clinicEnrollments)
      .where(
        and(
          eq(clinicEnrollments.clinicId, parsed.data.clinicId),
          eq(clinicEnrollments.clientUserId, clientId),
        ),
      )
      .limit(1);

    let enrollmentId: string;
    if (existing) {
      enrollmentId = existing.id;
      await db
        .update(clinicEnrollments)
        .set({ referrerUserId, cohortLabel, updatedAt: now })
        .where(eq(clinicEnrollments.id, existing.id));
    } else {
      enrollmentId = randomUUID();
      await db.insert(clinicEnrollments).values({
        id: enrollmentId,
        clinicId: parsed.data.clinicId,
        clientUserId: clientId,
        referrerUserId,
        consentSharedWithClinic: false,
        cohortLabel,
        status: 'enrolled',
        enrolledAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    void recordAudit({
      actorUserId: user!.id,
      actorRole: user!.role,
      action: 'admin_attach_clinic',
      targetType: 'clinic_enrollment',
      targetId: enrollmentId,
      metadata: { clinicId: parsed.data.clinicId, referrerUserId, cohortLabel },
    });

    return NextResponse.json({ ok: true, enrollmentId, consentPending: true });
  } catch (err) {
    logError('admin_attach_clinic_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

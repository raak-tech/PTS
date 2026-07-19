import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { getClientEnrollment, redeemEnrollmentCode } from '@/lib/clinic-enroll';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const bodySchema = z.object({ code: z.string().trim().min(3).max(32) });

/** Current clinic enrollment for the signed-in client (onboarding state). */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const enrollment = await getClientEnrollment(user.id);
    return NextResponse.json({ ok: true, enrollment });
  } catch (err) {
    logError('enroll_code_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

/** Redeem a clinic enrollment code. Consent is a separate follow-up call. */
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

    const result = await redeemEnrollmentCode(user.id, parsed.data.code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!result.alreadyEnrolled) {
      void recordAudit({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'clinic_enrollment_redeemed',
        targetType: 'clinic_enrollment',
        targetId: result.enrollmentId,
        metadata: { clinicId: result.clinicId, cohortLabel: result.cohortLabel },
      });
    }

    return NextResponse.json({
      ok: true,
      enrollmentId: result.enrollmentId,
      clinicName: result.clinicName,
      cohortLabel: result.cohortLabel,
      alreadyEnrolled: result.alreadyEnrolled,
      consentSharedWithClinic: result.consentSharedWithClinic,
    });
  } catch (err) {
    logError('enroll_code_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

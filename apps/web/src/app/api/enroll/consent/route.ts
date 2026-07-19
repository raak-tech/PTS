import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { setClinicSharingConsent } from '@/lib/clinic-enroll';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const bodySchema = z.object({
  enrollmentId: z.string().trim().min(1),
  granted: z.boolean(),
});

/**
 * Record the patient's SEPARATE clinic-sharing consent (distinct from the PTS
 * program consent). Withdrawing does not end the PTS program.
 */
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

    const result = await setClinicSharingConsent(user.id, parsed.data.enrollmentId, parsed.data.granted);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });

    void recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: parsed.data.granted ? 'clinic_sharing_consent_granted' : 'clinic_sharing_consent_withdrawn',
      targetType: 'clinic_enrollment',
      targetId: parsed.data.enrollmentId,
    });

    return NextResponse.json({ ok: true, consentSharedWithClinic: parsed.data.granted });
  } catch (err) {
    logError('enroll_consent_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

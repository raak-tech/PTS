import { randomUUID } from 'node:crypto';

import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { clinicEnrollmentCodes } from '@/db/schema';
import { recordAudit } from '@/lib/audit';
import { requireClinicActor } from '@/lib/clinic-access';
import { generateEnrollmentCode } from '@/lib/clinic-enroll';
import { logError } from '@/lib/logger';

const createSchema = z.object({
  cohortLabel: z.string().trim().min(1).max(120).nullable().optional(),
  maxUses: z.number().int().positive().max(1000).nullable().optional(),
  expiresInDays: z.number().int().positive().max(365).nullable().optional(),
});

/** List this clinic's enrollment codes (referrer + clinic_admin). */
export async function GET(request: Request) {
  try {
    const actor = await requireClinicActor(request);
    if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const db = getDb();
    const rows = await db
      .select({
        id: clinicEnrollmentCodes.id,
        code: clinicEnrollmentCodes.code,
        cohortLabel: clinicEnrollmentCodes.cohortLabel,
        maxUses: clinicEnrollmentCodes.maxUses,
        uses: clinicEnrollmentCodes.uses,
        expiresAt: clinicEnrollmentCodes.expiresAt,
        createdByUserId: clinicEnrollmentCodes.createdByUserId,
        createdAt: clinicEnrollmentCodes.createdAt,
      })
      .from(clinicEnrollmentCodes)
      .where(eq(clinicEnrollmentCodes.clinicId, actor.clinicId))
      .orderBy(desc(clinicEnrollmentCodes.createdAt));

    // A referrer only sees codes they created; clinic_admin sees all.
    const visible = actor.membershipRole === 'referrer'
      ? rows.filter((r) => r.createdByUserId === actor.userId)
      : rows;

    return NextResponse.json({
      ok: true,
      codes: visible.map((r) => ({
        id: r.id,
        code: r.code,
        cohortLabel: r.cohortLabel,
        maxUses: r.maxUses,
        uses: r.uses,
        expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        expired: r.expiresAt ? r.expiresAt.getTime() <= Date.now() : false,
        exhausted: r.maxUses != null && r.uses >= r.maxUses,
      })),
    });
  } catch (err) {
    logError('clinic_codes_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

/** Generate a new enrollment code for a cohort. */
export async function POST(request: Request) {
  try {
    const actor = await requireClinicActor(request);
    if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

    const db = getDb();
    const now = new Date();
    const expiresAt = parsed.data.expiresInDays
      ? new Date(now.getTime() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Retry a few times on the (rare) unique-code collision.
    let code = generateEnrollmentCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const [clash] = await db
        .select({ id: clinicEnrollmentCodes.id })
        .from(clinicEnrollmentCodes)
        .where(eq(clinicEnrollmentCodes.code, code))
        .limit(1);
      if (!clash) break;
      code = generateEnrollmentCode();
    }

    const id = randomUUID();
    await db.insert(clinicEnrollmentCodes).values({
      id,
      clinicId: actor.clinicId,
      code,
      createdByUserId: actor.userId,
      cohortLabel: parsed.data.cohortLabel ?? null,
      maxUses: parsed.data.maxUses ?? null,
      uses: 0,
      expiresAt,
      createdAt: now,
    });

    void recordAudit({
      actorUserId: actor.userId,
      actorRole: `clinic_${actor.membershipRole}`,
      action: 'clinic_enrollment_code_created',
      targetType: 'clinic_enrollment_code',
      targetId: id,
      metadata: { cohortLabel: parsed.data.cohortLabel ?? null, maxUses: parsed.data.maxUses ?? null },
    });

    return NextResponse.json({
      ok: true,
      code: { id, code, cohortLabel: parsed.data.cohortLabel ?? null, maxUses: parsed.data.maxUses ?? null, uses: 0, expiresAt: expiresAt ? expiresAt.toISOString() : null },
    });
  } catch (err) {
    logError('clinic_codes_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

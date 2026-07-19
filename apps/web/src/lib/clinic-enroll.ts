import { randomBytes, randomUUID } from 'node:crypto';

import { and, eq, sql } from 'drizzle-orm';

import { getDb } from '@/db';
import { clinicEnrollmentCodes, clinicEnrollments, clinics, users } from '@/db/schema';

/** Readable code alphabet: no 0/O/1/I to avoid transcription errors. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateEnrollmentCode(length = 6): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export type RedeemResult =
  | {
      ok: true;
      enrollmentId: string;
      clinicId: string;
      clinicName: string;
      cohortLabel: string | null;
      alreadyEnrolled: boolean;
      consentSharedWithClinic: boolean;
    }
  | { ok: false; error: 'invalid_code' | 'expired' | 'exhausted' | 'clinic_inactive' | 'not_client' };

/**
 * Redeem a clinic enrollment code for a client. Creates a clinic attribution but
 * does NOT grant clinic-sharing consent — that is a separate step (Run 2 UX).
 * Idempotent: re-redeeming returns the existing enrollment without consuming a use.
 */
export async function redeemEnrollmentCode(userId: string, rawCode: string): Promise<RedeemResult> {
  const db = getDb();
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: 'invalid_code' };

  const [client] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!client || client.role !== 'client') return { ok: false, error: 'not_client' };

  const [codeRow] = await db
    .select()
    .from(clinicEnrollmentCodes)
    .where(eq(clinicEnrollmentCodes.code, code))
    .limit(1);
  if (!codeRow) return { ok: false, error: 'invalid_code' };

  const [clinic] = await db
    .select({ id: clinics.id, name: clinics.name, status: clinics.status })
    .from(clinics)
    .where(eq(clinics.id, codeRow.clinicId))
    .limit(1);
  if (!clinic || clinic.status !== 'active') return { ok: false, error: 'clinic_inactive' };

  if (codeRow.expiresAt && codeRow.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: 'expired' };
  }

  const [existing] = await db
    .select()
    .from(clinicEnrollments)
    .where(
      and(
        eq(clinicEnrollments.clinicId, codeRow.clinicId),
        eq(clinicEnrollments.clientUserId, userId),
      ),
    )
    .limit(1);

  if (existing) {
    return {
      ok: true,
      enrollmentId: existing.id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      cohortLabel: existing.cohortLabel,
      alreadyEnrolled: true,
      consentSharedWithClinic: existing.consentSharedWithClinic,
    };
  }

  if (codeRow.maxUses != null && codeRow.uses >= codeRow.maxUses) {
    return { ok: false, error: 'exhausted' };
  }

  const now = new Date();
  const enrollmentId = randomUUID();
  await db.insert(clinicEnrollments).values({
    id: enrollmentId,
    clinicId: codeRow.clinicId,
    clientUserId: userId,
    referrerUserId: codeRow.createdByUserId,
    enrollmentCode: code,
    consentSharedWithClinic: false,
    cohortLabel: codeRow.cohortLabel,
    status: 'enrolled',
    enrolledAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await db
    .update(clinicEnrollmentCodes)
    .set({ uses: sql`${clinicEnrollmentCodes.uses} + 1` })
    .where(eq(clinicEnrollmentCodes.id, codeRow.id));

  return {
    ok: true,
    enrollmentId,
    clinicId: clinic.id,
    clinicName: clinic.name,
    cohortLabel: codeRow.cohortLabel,
    alreadyEnrolled: false,
    consentSharedWithClinic: false,
  };
}

/** Grant or withdraw clinic-sharing consent for the client's enrollment. */
export async function setClinicSharingConsent(
  userId: string,
  enrollmentId: string,
  granted: boolean,
): Promise<{ ok: boolean; error?: 'not_found' }> {
  const db = getDb();
  const [enrollment] = await db
    .select({ id: clinicEnrollments.id, clientUserId: clinicEnrollments.clientUserId })
    .from(clinicEnrollments)
    .where(eq(clinicEnrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment || enrollment.clientUserId !== userId) return { ok: false, error: 'not_found' };

  const now = new Date();
  await db
    .update(clinicEnrollments)
    .set(
      granted
        ? { consentSharedWithClinic: true, consentSharedAt: now, consentWithdrawnAt: null, updatedAt: now }
        : { consentSharedWithClinic: false, consentWithdrawnAt: now, updatedAt: now },
    )
    .where(eq(clinicEnrollments.id, enrollmentId));

  return { ok: true };
}

/** The client's current clinic enrollment, if any (for mobile onboarding state). */
export async function getClientEnrollment(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      enrollmentId: clinicEnrollments.id,
      clinicId: clinicEnrollments.clinicId,
      clinicName: clinics.name,
      cohortLabel: clinicEnrollments.cohortLabel,
      status: clinicEnrollments.status,
      consentSharedWithClinic: clinicEnrollments.consentSharedWithClinic,
    })
    .from(clinicEnrollments)
    .innerJoin(clinics, eq(clinics.id, clinicEnrollments.clinicId))
    .where(eq(clinicEnrollments.clientUserId, userId))
    .limit(1);
  return row ?? null;
}

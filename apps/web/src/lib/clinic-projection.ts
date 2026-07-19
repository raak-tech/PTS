import { and, eq, inArray, isNull } from 'drizzle-orm';

import { getDb } from '@/db';
import { clinicEnrollments, planWeeks, plans, users } from '@/db/schema';
import type { ClinicActor } from '@/lib/clinic-access';
import {
  coarseEngagementState,
  getPhysioSelfReports,
  getPtsEngagement,
} from '@/lib/clinic-engagement';

/**
 * The ONLY fields a clinic (referrer or clinic-admin) may see per patient.
 * Never messages, counselling notes, reflections, read-out content, safety
 * detail, or plan_weeks.content. Enforced by construction here.
 */
export type ClinicPatientRow = {
  enrollmentId: string;
  patientLabel: string;
  cohortLabel: string | null;
  status: string;
  referrerUserId: string | null;
  enrolledAt: string | null;
  firstActiveAt: string | null;
  currentWeek: number;
  ptsEngagement: {
    /** clearly labelled: PTS program engagement, NOT physio adherence */
    engagedDays30: number;
    lastActiveAt: string | null;
    state: 'active' | 'slipping' | 'inactive';
  };
  physioSelfReport: {
    /** patient self-report only; never device verified */
    reportedDays30: number;
    completionPct: number | null;
    lastStatus: string | null;
  };
};

/** Non-identifying label: first name if available, else stable pseudonym. */
function patientLabel(displayName: string | null, id: string): string {
  const name = (displayName ?? '').trim();
  if (name && !/^\+?\d[\d\s]*$/.test(name)) {
    return name.split(/\s+/)[0];
  }
  return `Patient ${id.slice(-4).toUpperCase()}`;
}

async function releasedWeekByClient(clientIds: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  if (clientIds.length === 0) return result;
  const db = getDb();

  const planRows = await db
    .select({ id: plans.id, userId: plans.userId })
    .from(plans)
    .where(inArray(plans.userId, clientIds));
  if (planRows.length === 0) return result;

  const planToClient = Object.fromEntries(planRows.map((p) => [p.id, p.userId]));
  const weekRows = await db
    .select({ planId: planWeeks.planId, weekNumber: planWeeks.weekNumber, status: planWeeks.status })
    .from(planWeeks)
    .where(inArray(planWeeks.planId, planRows.map((p) => p.id)));

  for (const w of weekRows) {
    if (w.status !== 'released' && w.status !== 'approved') continue;
    const clientId = planToClient[w.planId];
    if (!clientId) continue;
    result[clientId] = Math.max(result[clientId] ?? 0, w.weekNumber);
  }
  return result;
}

export type ClinicEnrollmentRecord = {
  id: string;
  clientUserId: string;
  referrerUserId: string | null;
  cohortLabel: string | null;
  status: string;
  enrolledAt: Date | null;
  firstActiveAt: Date | null;
};

/**
 * Consented, non-withdrawn enrollments for the actor's clinic. A referrer only
 * sees patients they enrolled; a clinic_admin sees the whole clinic.
 */
export async function getVisibleEnrollments(actor: ClinicActor): Promise<ClinicEnrollmentRecord[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: clinicEnrollments.id,
      clientUserId: clinicEnrollments.clientUserId,
      referrerUserId: clinicEnrollments.referrerUserId,
      cohortLabel: clinicEnrollments.cohortLabel,
      status: clinicEnrollments.status,
      enrolledAt: clinicEnrollments.enrolledAt,
      firstActiveAt: clinicEnrollments.firstActiveAt,
    })
    .from(clinicEnrollments)
    .where(
      and(
        eq(clinicEnrollments.clinicId, actor.clinicId),
        eq(clinicEnrollments.consentSharedWithClinic, true),
        isNull(clinicEnrollments.consentWithdrawnAt),
      ),
    );

  if (actor.membershipRole === 'referrer') {
    return rows.filter((r) => r.referrerUserId === actor.userId);
  }
  return rows;
}

/** Build the whitelisted per-patient projection for a clinic actor. */
export async function buildClinicPatientRows(actor: ClinicActor): Promise<ClinicPatientRow[]> {
  const enrollments = await getVisibleEnrollments(actor);
  const clientIds = enrollments.map((e) => e.clientUserId);
  if (clientIds.length === 0) return [];

  const db = getDb();
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [userRows, engagement, physio, releasedWeeks] = await Promise.all([
    db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(inArray(users.id, clientIds)),
    getPtsEngagement(clientIds, since30, now),
    getPhysioSelfReports(clientIds, since30, now),
    releasedWeekByClient(clientIds),
  ]);

  const nameById = Object.fromEntries(userRows.map((u) => [u.id, u.displayName]));

  return enrollments.map((e) => {
    const eng = engagement[e.clientUserId];
    const phys = physio[e.clientUserId];
    const reportedDays = phys?.total ?? 0;
    const completed = phys ? phys.yes + phys.partly * 0.5 : 0;
    return {
      enrollmentId: e.id,
      patientLabel: patientLabel(nameById[e.clientUserId] ?? null, e.clientUserId),
      cohortLabel: e.cohortLabel,
      status: e.status,
      referrerUserId: e.referrerUserId,
      enrolledAt: e.enrolledAt ? e.enrolledAt.toISOString() : null,
      firstActiveAt: e.firstActiveAt ? e.firstActiveAt.toISOString() : null,
      currentWeek: releasedWeeks[e.clientUserId] ?? 0,
      ptsEngagement: {
        engagedDays30: eng?.days.size ?? 0,
        lastActiveAt: eng?.lastAt ? eng.lastAt.toISOString() : null,
        state: coarseEngagementState(eng?.lastAt ?? null, now),
      },
      physioSelfReport: {
        reportedDays30: reportedDays,
        completionPct: reportedDays > 0 ? Math.round((completed / reportedDays) * 100) : null,
        lastStatus: phys?.lastStatus ?? null,
      },
    };
  });
}

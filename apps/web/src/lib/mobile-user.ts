import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeResponses, planWeeks, plans, users } from '@/db/schema';
import { toDateIso } from '@/lib/program-calendar';

export type MobileSessionUser = {
  id: string;
  role: string;
  displayName: string | null;
  phone: string | null;
  pilotCohort: 'legacy' | 'pain_script';
  intakeComplete: boolean;
  planApproved: boolean;
  programAnchorDate?: string | null;
  releasedWeeks?: number[];
};

export async function buildMobileSessionUser(userId: string): Promise<MobileSessionUser | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [intake] = await db
    .select({ completedAt: intakeResponses.completedAt })
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, userId))
    .limit(1);

  const [plan] = await db
    .select({
      id: plans.id,
      status: plans.status,
      programAnchorDate: plans.programAnchorDate,
      approvedAt: plans.approvedAt,
    })
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.createdAt))
    .limit(1);

  const planApproved = plan?.status === 'approved';

  let programAnchorDate: string | null = plan?.programAnchorDate ?? null;
  if (!programAnchorDate && plan?.approvedAt) {
    programAnchorDate = toDateIso(plan.approvedAt);
  }

  let releasedWeeks: number[] = [];
  if (plan) {
    const releasedRows: { weekNumber: number }[] = await db
      .select({ weekNumber: planWeeks.weekNumber })
      .from(planWeeks)
      .where(and(eq(planWeeks.planId, plan.id), isNotNull(planWeeks.releasedAt)))
      .orderBy(planWeeks.weekNumber);

    releasedWeeks = releasedRows.map((r) => r.weekNumber);

    if (releasedWeeks.length === 0 && plan.status === 'approved') {
      const approvedRows: { weekNumber: number }[] = await db
        .select({ weekNumber: planWeeks.weekNumber })
        .from(planWeeks)
        .where(and(eq(planWeeks.planId, plan.id), eq(planWeeks.status, 'approved')))
        .orderBy(planWeeks.weekNumber);
      releasedWeeks = approvedRows.map((r) => r.weekNumber);
      // Week-1-first: never auto-unlock all six. Legacy approved plans with no
      // plan_weeks rows fall back to Week 1 only.
      if (releasedWeeks.length === 0) {
        releasedWeeks = [1];
      }
    }
  }

  return {
    id: user.id,
    role: user.role,
    displayName: user.displayName,
    phone: user.phone,
    pilotCohort: user.pilotCohort === 'pain_script' ? 'pain_script' : 'legacy',
    intakeComplete: Boolean(intake?.completedAt),
    planApproved,
    programAnchorDate,
    releasedWeeks,
  };
}

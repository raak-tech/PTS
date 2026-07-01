import type { Metadata } from 'next';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { getDb } from '../../../db';
import { intakeResponses, planWeeks, plans, users } from '../../../db/schema';
import { PlanReviewClient } from './PlanReviewClient';
import { PendingIntakesClient } from './PendingIntakesClient';
import type { GeneratedPlan } from '../../../lib/plan-generator';

export const metadata: Metadata = { title: 'Plan review | Provider' };

export default async function ProviderPlansPage() {
  const db = getDb();

  // Pending intakes (no plan yet)
  type PendingIntakeRow = { userId: string; painSource: string; hasRedFlags: boolean; isSafe: boolean; createdAt: Date };
  const pendingIntakes = (await db
    .select({
      userId: intakeResponses.userId,
      painSource: intakeResponses.painSource,
      hasRedFlags: intakeResponses.hasRedFlags,
      isSafe: intakeResponses.isSafe,
      createdAt: intakeResponses.createdAt,
    })
    .from(intakeResponses)
    .leftJoin(plans, eq(intakeResponses.userId, plans.userId))
    .where(isNull(plans.id))
    .orderBy(intakeResponses.createdAt)) as PendingIntakeRow[];

  // All draft plans awaiting review
  type PlanRow = { id: string; userId: string; generatedContent: string; counselorNotes: string | null; status: string; createdAt: Date };
  const draftPlans = (await db
    .select()
    .from(plans)
    .where(eq(plans.status, 'draft'))
    .orderBy(plans.createdAt)) as PlanRow[];

  const approvedPlans = (await db
    .select()
    .from(plans)
    .where(eq(plans.status, 'approved'))
    .orderBy(plans.createdAt)) as PlanRow[];

  // Fetch client emails for display (for both draft/approved plans AND pending intakes)
  const allUserIds = [...new Set([...draftPlans, ...approvedPlans, ...pendingIntakes].map(p => p.userId))];
  type UserRow = { id: string; email: string };
  const clientUsers = allUserIds.length > 0
    ? (await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, allUserIds))) as UserRow[]
    : [];

  const emailById = Object.fromEntries(clientUsers.map(u => [u.id, u.email]));

  // Fetch intake responses for context (draft/approved plans)
  const planUserIds = [...new Set([...draftPlans, ...approvedPlans].map(p => p.userId))];
  type IntakeContextRow = { userId: string; painSource: string; painDescription: string; recoveryGoal: string };
  const intakes = planUserIds.length > 0
    ? (await db.select({ userId: intakeResponses.userId, painSource: intakeResponses.painSource, painDescription: intakeResponses.painDescription, recoveryGoal: intakeResponses.recoveryGoal })
        .from(intakeResponses)
        .where(inArray(intakeResponses.userId, planUserIds))) as IntakeContextRow[]
    : [];

  const intakeByUserId = Object.fromEntries(intakes.map(i => [i.userId, i]));

  // Fetch planWeeks statuses for all draft plans so the editor shows current state
  const draftPlanIds = draftPlans.map(p => p.id);
  type WeekStatusRow = { planId: string; weekNumber: number; status: string };
  const allWeekStatuses: WeekStatusRow[] = draftPlanIds.length > 0
    ? (await db
        .select({ planId: planWeeks.planId, weekNumber: planWeeks.weekNumber, status: planWeeks.status })
        .from(planWeeks)
        .where(inArray(planWeeks.planId, draftPlanIds))) as WeekStatusRow[]
    : [];

  const weekStatusByPlan: Record<string, Record<number, 'draft' | 'edited' | 'approved'>> = {};
  for (const row of allWeekStatuses) {
    if (!weekStatusByPlan[row.planId]) weekStatusByPlan[row.planId] = {};
    weekStatusByPlan[row.planId][row.weekNumber] = row.status as 'draft' | 'edited' | 'approved';
  }

  function anon(email: string) {
    const [local] = email.split('@');
    return `${local[0]}***@${email.split('@')[1]}`;
  }

  const enriched = draftPlans.map(p => ({
    ...p,
    clientEmail: anon(emailById[p.userId] ?? 'unknown@unknown.com'),
    intake: intakeByUserId[p.userId] ?? null,
    parsed: JSON.parse(p.generatedContent) as GeneratedPlan,
    weekStatuses: weekStatusByPlan[p.id] ?? {},
    hasCrisisNotes: (p.counselorNotes ?? '').includes('CRISIS'),
  }));

  return (
    <>
      <h1 className="provider-page-title">Plan review</h1>
      <p className="provider-page-subtitle">Approve drafts and edit week content before clients see it.</p>

      {/* Pending intakes section */}
      <PendingIntakesClient
        intakes={pendingIntakes.map(intake => ({
          userId: intake.userId,
          painSource: intake.painSource,
          hasRedFlags: intake.hasRedFlags,
          isSafe: intake.isSafe,
          createdAt: intake.createdAt,
          email: emailById[intake.userId] ?? 'unknown@unknown.com',
        }))}
      />

      {enriched.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 18 }}>
          <p style={{ margin: 0 }}>No draft plans awaiting review.</p>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>Check pending intakes above to generate new plans.</p>
        </div>
      )}

      {enriched.map(plan => (
        <PlanReviewClient
          key={plan.id}
          planId={plan.id}
          clientEmail={plan.clientEmail}
          clientId={plan.userId}
          intake={plan.intake}
          plan={plan.parsed}
          createdAt={plan.createdAt.toLocaleDateString()}
          initialWeekStatuses={plan.weekStatuses}
          hasCrisisNotes={plan.hasCrisisNotes}
        />
      ))}

      {approvedPlans.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 16, color: 'var(--muted)' }}>Approved plans ({approvedPlans.length})</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {approvedPlans.map(p => (
              <div key={p.id} style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}>{anon(emailById[p.userId] ?? 'unknown@unknown.com')}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Approved</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

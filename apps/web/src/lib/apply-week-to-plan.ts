import { randomUUID } from 'node:crypto';

import { and, desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { planWeeks, plans } from '@/db/schema';
import type { GeneratedPlan, WeekPlan } from '@/lib/plan-generator';

export async function applyWeekToApprovedPlan(
  clientId: string,
  counselorId: string,
  weekPlan: WeekPlan,
): Promise<string | null> {
  const db = getDb();
  const [approved] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, clientId), eq(plans.status, 'approved')))
    .orderBy(desc(plans.createdAt))
    .limit(1);

  if (!approved) return null;

  let plan: GeneratedPlan;
  try {
    plan = JSON.parse(approved.generatedContent) as GeneratedPlan;
  } catch {
    return null;
  }

  const idx = plan.weeks.findIndex((w) => w.week === weekPlan.week);
  if (idx >= 0) {
    plan.weeks[idx] = weekPlan;
  } else {
    plan.weeks.push(weekPlan);
    plan.weeks.sort((a, b) => a.week - b.week);
  }

  const planContent = JSON.stringify(plan);
  await db
    .update(plans)
    .set({ generatedContent: planContent })
    .where(eq(plans.id, approved.id));

  // Upsert a plan_weeks draft row so the new week is immediately editable and
  // approvable per-week in the counselor workspace. Never downgrade an already
  // approved week back to draft.
  const now = new Date();
  const weekContent = JSON.stringify(weekPlan);
  const [existingWeek] = await db
    .select({ id: planWeeks.id, status: planWeeks.status })
    .from(planWeeks)
    .where(and(eq(planWeeks.planId, approved.id), eq(planWeeks.weekNumber, weekPlan.week)))
    .limit(1);

  if (existingWeek) {
    if (existingWeek.status !== 'approved') {
      await db
        .update(planWeeks)
        .set({ content: weekContent, status: 'draft', editedAt: now, counselorId })
        .where(and(eq(planWeeks.planId, approved.id), eq(planWeeks.weekNumber, weekPlan.week)));
    }
  } else {
    await db.insert(planWeeks).values({
      id: randomUUID(),
      planId: approved.id,
      weekNumber: weekPlan.week,
      content: weekContent,
      status: 'draft',
      counselorId,
      createdAt: now,
    });
  }

  return approved.id;
}

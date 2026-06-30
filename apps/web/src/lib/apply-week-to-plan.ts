import { and, desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { plans } from '@/db/schema';
import type { GeneratedPlan, WeekPlan } from '@/lib/plan-generator';
import { seedDailyFromApprovedPlan } from '@/lib/seed-daily-from-plan';

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

  await seedDailyFromApprovedPlan(db, {
    clientId,
    counselorId,
    planContent,
    planWeek: weekPlan.week,
  });

  return approved.id;
}

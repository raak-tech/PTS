import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { planWeeks } from '@/db/schema';
import type { GeneratedPlan } from '@/lib/plan-generator';

export async function seedDraftPlanWeeks(planId: string, generated: GeneratedPlan): Promise<void> {
  const db = getDb();
  const weeks = generated.weeks.slice(0, 1);
  const now = new Date();

  for (const week of weeks) {
    const [existing] = await db
      .select({ id: planWeeks.id })
      .from(planWeeks)
      .where(and(eq(planWeeks.planId, planId), eq(planWeeks.weekNumber, week.week)))
      .limit(1);

    if (existing) continue;

    await db.insert(planWeeks).values({
      id: randomUUID(),
      planId,
      weekNumber: week.week,
      content: JSON.stringify(week),
      status: 'draft',
      createdAt: now,
    });
  }
}

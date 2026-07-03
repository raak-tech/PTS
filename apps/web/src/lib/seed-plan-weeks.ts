import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { planWeeks } from '@/db/schema';
import type { GeneratedPlan } from '@/lib/plan-generator';

/**
 * Seeds the Week 1 draft row for a freshly generated plan.
 *
 * Week-1-first model: only Week 1 is seeded here. We force `weekNumber = 1`
 * regardless of the index the LLM emits, so the counselor's Week 1 approval
 * slot is never left empty/shaded due to an odd LLM week number.
 *
 * Returns true if a Week 1 row exists (seeded now or already present).
 */
export async function seedDraftPlanWeeks(planId: string, generated: GeneratedPlan): Promise<boolean> {
  const db = getDb();

  const firstWeek = generated.weeks?.find((w) => w.week === 1) ?? generated.weeks?.[0];
  if (!firstWeek) return false;

  const [existing] = await db
    .select({ id: planWeeks.id })
    .from(planWeeks)
    .where(and(eq(planWeeks.planId, planId), eq(planWeeks.weekNumber, 1)))
    .limit(1);

  if (existing) return true;

  await db.insert(planWeeks).values({
    id: randomUUID(),
    planId,
    weekNumber: 1,
    content: JSON.stringify({ ...firstWeek, week: 1 }),
    status: 'draft',
    createdAt: new Date(),
  });

  return true;
}

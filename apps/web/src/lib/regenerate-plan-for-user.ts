import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeResponses, plans } from '@/db/schema';
import { log, logError } from '@/lib/logger';
import { generatePlan } from '@/lib/plan-generator';

export async function regeneratePlanDraftForUser(userId: string): Promise<string | null> {
  const db = getDb();
  const [saved] = await db
    .select()
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, userId))
    .limit(1);

  if (!saved) {
    logError('plan_regenerate_skipped', new Error('intake row missing'), { userId });
    return null;
  }

  try {
    const generated = await generatePlan({
      ...saved,
      hasDependents:
        saved.hasDependents == null ? null : saved.hasDependents ? 'yes' : 'no',
    });

    const isCrisis = saved.hasRedFlags || !saved.isSafe;
    const crisisNote = isCrisis
      ? '🚨 CRISIS: RED FLAGS OR SAFETY CONCERN — REQUIRES IMMEDIATE REVIEW'
      : null;

    const planId = randomUUID();
    await db.insert(plans).values({
      id: planId,
      userId,
      intakeResponseId: saved.id,
      generatedContent: JSON.stringify(generated),
      status: 'draft',
      counselorNotes: crisisNote,
      createdAt: new Date(),
    });

    log('plan_regenerated', { userId, planId });
    return planId;
  } catch (err) {
    logError('plan_regenerate_failed', err, { userId });
    throw err;
  }
}

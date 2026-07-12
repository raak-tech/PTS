import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeResponses, plans } from '@/db/schema';
import { loadPainScriptSignalsForUser } from '@/lib/confidential/load-pain-script-signals';
import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import { getApprovedFormulation } from '@/lib/pain-script/formulation-store';
import { generatePlanFromFormulation } from '@/lib/pain-script/plan-from-formulation';
import { loadProfileSnapshot } from '@/lib/pain-script/profile-snapshot';
import { log, logError } from '@/lib/logger';
import { generatePlan } from '@/lib/plan-generator';
import { seedDraftPlanWeeks } from '@/lib/seed-plan-weeks';

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

  const cohort = await getUserPilotCohort(userId);

  try {
    let generated;
    let formulationId: string | null = null;
    let formulationVersion: number | null = null;

    if (usesPainScriptPath(cohort)) {
      const approved = await getApprovedFormulation(userId);
      if (!approved) {
        throw new Error('formulation_not_approved');
      }
      formulationId = approved.id;
      formulationVersion = approved.version;
      const profile = await loadProfileSnapshot(userId);
      generated = await generatePlanFromFormulation(
        approved.formulation,
        {
          painSource: saved.painSource,
          painDescription: saved.painDescription,
          painDuration: saved.painDuration,
          activitiesAffected: saved.activitiesAffected,
          biggestChange: saved.biggestChange,
          recoveryGoal: saved.recoveryGoal,
          ayurvedaPreferences: saved.ayurvedaPreferences,
          onsetType: (saved.onsetType as 'sudden' | 'gradual' | 'mixed' | null) ?? null,
        },
        profile,
        { userId },
      );
    } else {
      const painScriptSignals = await loadPainScriptSignalsForUser(userId);
      generated = await generatePlan(
        {
          ...saved,
          hasDependents:
            saved.hasDependents == null ? null : saved.hasDependents ? 'yes' : 'no',
          painScriptSignals,
        },
        { userId },
      );
    }

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
      formulationId,
      formulationVersion,
      status: 'draft',
      counselorNotes: crisisNote,
      createdAt: new Date(),
    });

    await seedDraftPlanWeeks(planId, generated);

    log('plan_regenerated', { userId, planId, cohort });
    return planId;
  } catch (err) {
    logError('plan_regenerate_failed', err, { userId });
    throw err;
  }
}

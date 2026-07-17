import { randomUUID } from 'node:crypto';

import { desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeResponses, intakeSessions, plans } from '@/db/schema';
import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { generateFormulation } from '@/lib/pain-script/formulation-generator';
import { saveFormulationDraft } from '@/lib/pain-script/formulation-store';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import {
  loadProfileSnapshot,
  seedClientProfileFromIntake,
} from '@/lib/pain-script/profile-snapshot';
import { log, logError } from '@/lib/logger';
import { sendEmail } from '@/lib/mailer';

async function sendCrisisAlert(userId: string, reason: string) {
  const message = `
CRISIS ALERT — PTS Formulation (Pain Script)

Client formulation flagged safety concern:
- User ID: ${userId}
- Reason: ${reason}

Review formulation and intake before any plan delivery.
  `.trim();
  const alertEmail = process.env.CRISIS_ALERT_EMAIL || 'support@pts.local';
  await sendEmail({
    to: alertEmail,
    subject: '🚨 PTS: Formulation Safety Flag',
    text: message,
  });
}

/** Stage 1 — run after intake confirm for pain_script cohort. */
export async function runFormulationGenerationForUser(userId: string): Promise<string | null> {
  const cohort = await getUserPilotCohort(userId);
  if (!usesPainScriptPath(cohort)) return null;

  const db = getDb();
  const [saved] = await db
    .select()
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, userId))
    .limit(1);
  if (!saved) {
    logError('formulation_skipped', new Error('intake missing'), { userId });
    return null;
  }

  const [session] = await db
    .select({ rawText: intakeSessions.rawText })
    .from(intakeSessions)
    .where(eq(intakeSessions.userId, userId))
    .orderBy(desc(intakeSessions.updatedAt))
    .limit(1);

  await seedClientProfileFromIntake(userId, saved);
  const profile = await loadProfileSnapshot(userId);

  try {
    const result = await generateFormulation(
      {
        painSource: saved.painSource,
        painSourceOther: saved.painSourceOther,
        painDescription: saved.painDescription,
        painDuration: saved.painDuration,
        activitiesAffected: saved.activitiesAffected,
        biggestChange: saved.biggestChange,
        recoveryGoal: saved.recoveryGoal,
        onsetType: saved.onsetType,
        ageRange: saved.ageRange,
        occupation: saved.occupation,
        socialSupport: saved.socialSupport,
        currentTreatment: saved.currentTreatment,
      },
      session?.rawText ?? null,
      profile,
      { userId },
    );

    const formulationId = await saveFormulationDraft(userId, saved.id, result);

    if (result.safetyFlag) {
      try {
        await sendCrisisAlert(userId, result.safetyReason ?? 'safety flag');
      } catch (emailErr) {
        logError('formulation_crisis_email_failed', emailErr, { userId });
      }
    }

    // Ensure pending_review stub plan exists (no Week 1 until formulation approved + generate plan)
    const [existingPlan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.userId, userId))
      .limit(1);

    if (!existingPlan) {
      const now = new Date();
      await db.insert(plans).values({
        id: randomUUID(),
        userId,
        intakeResponseId: saved.id,
        generatedContent: JSON.stringify({
          weeks: [],
          overview: '',
          clientSummary: '',
          keyThemes: [],
          watchPoints: [],
          formulationSummary: '',
        }),
        status: 'pending_review',
        counselorNotes: result.safetyFlag
          ? '🚨 CRISIS: FORMULATION SAFETY FLAG — REQUIRES IMMEDIATE REVIEW'
          : null,
        createdAt: now,
      });
    }

    log('formulation_saved', { userId, formulationId, safetyFlag: result.safetyFlag });
    return formulationId;
  } catch (err) {
    logError('formulation_generation_failed', err, { userId });
    throw err;
  }
}

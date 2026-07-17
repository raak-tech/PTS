import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { loadPainScriptSignalsForUser } from '@/lib/confidential/load-pain-script-signals';
import { getDb } from '@/db';
import { intakeResponses, plans } from '@/db/schema';
import { log, logError } from '@/lib/logger';
import { sendEmail } from '@/lib/mailer';
import { generatePlan } from '@/lib/plan-generator';

async function sendCrisisAlert({
  userId,
  hasRedFlags,
  isSafe,
  alertEmail,
}: {
  userId: string;
  hasRedFlags: boolean;
  isSafe: boolean;
  alertEmail: string;
}) {
  const message = `
CRISIS ALERT — PTS Intake

A client has completed intake with safety concerns:
- Red flags detected: ${hasRedFlags}
- Client reported unsafe: ${!isSafe}
- User ID: ${userId}

This client's plan has been marked "CRISIS" and requires immediate review before delivery.

Action: Log in to PTS provider console → /provider/metrics → Review flagged clients.

Do not delay. Contact the client immediately.
  `.trim();

  await sendEmail({
    to: alertEmail,
    subject: '🚨 PTS: Crisis Alert — Client Safety Concern',
    text: message,
  });
}

export async function generateAndSavePlanForUser(
  userId: string,
  flags: { hasRedFlags: boolean; isSafe: boolean },
) {
  const db = getDb();
  const [saved] = await db
    .select()
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, userId))
    .limit(1);

  if (!saved) {
    logError('plan_generation_skipped', new Error('intake row missing'), { userId });
    return;
  }

  try {
    const painScriptSignals = await loadPainScriptSignalsForUser(userId);
    const generated = await generatePlan(
      {
        ...saved,
        hasDependents:
          saved.hasDependents == null ? null : saved.hasDependents ? 'yes' : 'no',
        painScriptSignals,
      },
      { userId },
    );
    const isCrisis = flags.hasRedFlags || !flags.isSafe;
    const crisisNote = isCrisis
      ? '🚨 CRISIS: RED FLAGS OR SAFETY CONCERN — REQUIRES IMMEDIATE REVIEW'
      : null;

    await db
      .insert(plans)
      .values({
        id: randomUUID(),
        userId,
        intakeResponseId: saved.id,
        generatedContent: JSON.stringify(generated),
        status: 'draft',
        counselorNotes: crisisNote,
        createdAt: new Date(),
      })
      .onConflictDoNothing();

    log('plan_saved', { userId, isCrisis });

    if (isCrisis) {
      try {
        const alertEmail = process.env.CRISIS_ALERT_EMAIL || 'support@pts.local';
        await sendCrisisAlert({
          userId,
          hasRedFlags: flags.hasRedFlags,
          isSafe: flags.isSafe,
          alertEmail,
        });
      } catch (emailErr) {
        logError('crisis_alert_email_failed', emailErr, { userId });
      }
    }
  } catch (planErr) {
    logError('plan_generation_failed', planErr, { userId });
  }
}

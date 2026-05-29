import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { intakeResponses, plans } from '@/db/schema';
import { logError, log } from '@/lib/logger';
import { generatePlan } from '@/lib/plan-generator';
import { getUserFromCookieHeader } from '@/lib/session';
import { sendEmail } from '@/lib/mailer';

async function sendCrisisAlert({ userId, hasRedFlags, isSafe, alertEmail }: any) {
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

const schema = z.object({
  painSource: z.string().min(1),
  painSourceOther: z.string().optional(),
  painDescription: z.string().min(1),
  painDuration: z.string().min(1),
  ageRange: z.string().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  affectsWork: z.string().optional(),
  hasDependents: z.string().optional(),
  priorTherapy: z.string().optional(),
  countryRegion: z.string().optional(),
  activitiesAffected: z.string().min(1),
  biggestChange: z.string().min(1),
  recoveryGoal: z.string().min(1),
  recoveryTimeline: z.string().optional(),
  currentTreatment: z.string().optional(),
  socialSupport: z.string().optional(),
  structurePreference: z.string().optional(),
  engagementTime: z.string().optional(),
  hasRedFlags: z.boolean(),
  isSafe: z.boolean(),
  consentGiven: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromCookieHeader(request.headers.get('cookie'));
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
    }

    const now = new Date();
    const db = getDb();

    // Upsert — allow re-submission if they come back and update
    await db
      .insert(intakeResponses)
      .values({
        id: randomUUID(),
        userId: user.id,
        ...parsed.data,
        painSourceOther: parsed.data.painSourceOther ?? null,
        recoveryTimeline: parsed.data.recoveryTimeline ?? null,
        currentTreatment: parsed.data.currentTreatment ?? null,
        socialSupport: parsed.data.socialSupport ?? null,
        structurePreference: parsed.data.structurePreference ?? null,
        engagementTime: parsed.data.engagementTime ?? null,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: intakeResponses.userId,
        set: {
          ...parsed.data,
          painSourceOther: parsed.data.painSourceOther ?? null,
          recoveryTimeline: parsed.data.recoveryTimeline ?? null,
          currentTreatment: parsed.data.currentTreatment ?? null,
          socialSupport: parsed.data.socialSupport ?? null,
          structurePreference: parsed.data.structurePreference ?? null,
          engagementTime: parsed.data.engagementTime ?? null,
          completedAt: now,
          updatedAt: now,
        },
      });

    // Fetch the saved intake row to pass full data to plan generator
    const [saved] = await db
      .select()
      .from(intakeResponses)
      .where(eq(intakeResponses.userId, user.id))
      .limit(1);

    // Generate the plan synchronously before responding.
    // Serverless functions on Vercel terminate after the response is sent,
    // so fire-and-forget is unreliable here.
    if (saved) {
      try {
        const generated = await generatePlan(saved);

        // Check for crisis conditions
        const isCrisis = parsed.data.hasRedFlags || !parsed.data.isSafe;
        const crisisNote = isCrisis ? '🚨 CRISIS: RED FLAGS OR SAFETY CONCERN — REQUIRES IMMEDIATE REVIEW' : null;

        await db.insert(plans).values({
          id: randomUUID(),
          userId: user.id,
          intakeResponseId: saved.id,
          generatedContent: JSON.stringify(generated),
          status: 'draft',
          counselorNotes: crisisNote,
          createdAt: new Date(),
        }).onConflictDoNothing();

        log('plan_saved', { userId: user.id, isCrisis });

        // Alert counselor if crisis
        if (isCrisis) {
          try {
            // Send alert email to clinical lead (placeholder)
            const alertEmail = process.env.CRISIS_ALERT_EMAIL || 'support@pts.local';
            await sendCrisisAlert({
              userId: user.id,
              hasRedFlags: parsed.data.hasRedFlags,
              isSafe: parsed.data.isSafe,
              alertEmail,
            });
          } catch (emailErr) {
            logError('crisis_alert_email_failed', emailErr, { userId: user.id });
          }
        }
      } catch (planErr) {
        // Plan generation failing should not block the intake submission.
        // The counselor can trigger regeneration manually.
        logError('plan_generation_failed', planErr, { userId: user.id });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('intake_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromCookieHeader(request.headers.get('cookie'));
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const db = getDb();
    const [intake] = await db
      .select()
      .from(intakeResponses)
      .where(eq(intakeResponses.userId, user.id))
      .limit(1);

    return NextResponse.json({ ok: true, intake: intake ?? null });
  } catch (err) {
    logError('intake_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

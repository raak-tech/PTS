import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { intakeResponses } from '@/db/schema';
import { runInBackground } from '@/lib/background-task';
import { logError } from '@/lib/logger';
import { regeneratePlanDraftForUser } from '@/lib/regenerate-plan-for-user';
import { getUserFromRequest } from '@/lib/session';

export const maxDuration = 300;

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
  ayurvedaPreferences: z.string().optional(),
  hasRedFlags: z.boolean(),
  isSafe: z.boolean(),
  consentGiven: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
    }

    const now = new Date();
    const db = getDb();

    const intakeValues = {
      ...parsed.data,
      hasDependents:
        parsed.data.hasDependents === 'yes'
          ? true
          : parsed.data.hasDependents === 'no'
            ? false
            : null,
      painSourceOther: parsed.data.painSourceOther ?? null,
      recoveryTimeline: parsed.data.recoveryTimeline ?? null,
      currentTreatment: parsed.data.currentTreatment ?? null,
      socialSupport: parsed.data.socialSupport ?? null,
      structurePreference: parsed.data.structurePreference ?? null,
      engagementTime: parsed.data.engagementTime ?? null,
      ayurvedaPreferences: parsed.data.ayurvedaPreferences ?? null,
    };

    await db
      .insert(intakeResponses)
      .values({
        id: randomUUID(),
        userId: user.id,
        ...intakeValues,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: intakeResponses.userId,
        set: {
          ...intakeValues,
          completedAt: now,
          updatedAt: now,
        },
      });

    // Generate the plan in the background so the client isn't stuck waiting on the LLM.
    runInBackground(
      regeneratePlanDraftForUser(user.id).catch((err) => {
        logError('intake_plan_background_failed', err, { userId: user.id });
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('intake_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
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

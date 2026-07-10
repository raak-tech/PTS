import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { intakeSessions, plans } from '@/db/schema';
import { getUserFromRequest } from '@/lib/session';
import { logError } from '@/lib/logger';

export const maxDuration = 60;

const bodySchema = z.object({
  intakeSessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 },
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid', detail: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { intakeSessionId } = parsed.data;
    const db = getDb();

    // Look up the intake session
    const [session] = await db
      .select({
        id: intakeSessions.id,
        userId: intakeSessions.userId,
        intakeResponseId: intakeSessions.intakeResponseId,
        status: intakeSessions.status,
      })
      .from(intakeSessions)
      .where(eq(intakeSessions.id, intakeSessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: 'session_not_found' },
        { status: 404 },
      );
    }

    // Verify ownership
    if (session.userId !== user.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 403 },
      );
    }

    // Check if a plan already exists for this user
    const [existingPlan] = await db
      .select({ id: plans.id, status: plans.status })
      .from(plans)
      .where(eq(plans.userId, user.id))
      .limit(1);

    if (existingPlan) {
      return NextResponse.json({
        ok: true,
        planSessionId: existingPlan.id,
        status: existingPlan.status,
        alreadyExists: true,
      });
    }

    // Create a pending_review plan — no LLM generation yet.
    // The counselor must review the intake data bar and approve before Week 1 is generated.
    const planId = randomUUID();
    const now = new Date();

    await db.insert(plans).values({
      id: planId,
      userId: user.id,
      intakeResponseId: session.intakeResponseId ?? '',
      generatedContent: JSON.stringify({
        weeks: [],
        overview: '',
        clientSummary: '',
        keyThemes: [],
        watchPoints: [],
      }),
      status: 'pending_review',
      counselorNotes: null,
      createdAt: now,
    });

    // Update intake session status
    await db
      .update(intakeSessions)
      .set({
        status: 'confirmed',
        updatedAt: now,
      })
      .where(eq(intakeSessions.id, intakeSessionId));

    return NextResponse.json({
      ok: true,
      planSessionId: planId,
      status: 'pending_review',
    });
  } catch (err) {
    logError('intake_generate_plan_error', err);
    const message =
      err instanceof Error ? err.message : 'internal';
    return NextResponse.json(
      { error: 'generate_plan_failed', detail: message },
      { status: 500 },
    );
  }
}

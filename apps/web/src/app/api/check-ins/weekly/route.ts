import { randomUUID } from 'node:crypto';

import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { weeklyCheckIns } from '@/db/schema';
import { assertCounselorForClient } from '@/lib/client-access';
import {
  formatWeeklyCheckInSummary,
  parseWeeklyCheckInAnswers,
  WEEKLY_CHECK_IN_PROMPTS,
} from '@/lib/check-in-prompts';
import { logError } from '@/lib/logger';
import { canAccessProviderConsole } from '@/lib/provider-console-access';
import { getUserFromRequest } from '@/lib/session';

const postSchema = z.object({
  weekNumber: z.number().int().min(1).max(6),
  weekStartIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  answers: z.object({
    q1: z.string().max(3000),
    q2: z.string().max(3000),
    q3: z.string().max(3000),
  }),
});

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('weekNumber');
    const clientIdParam = searchParams.get('clientId');
    const db = getDb();

    let targetClientId = user.id;
    if (canAccessProviderConsole(user) && user.role !== 'client') {
      if (!clientIdParam) return NextResponse.json({ error: 'clientId_required' }, { status: 400 });
      if (!(await assertCounselorForClient(user.id, clientIdParam))) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      targetClientId = clientIdParam;
    } else if (user.role !== 'client') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    if (weekNumber) {
      const week = Number.parseInt(weekNumber, 10);
      const [row] = await db
        .select()
        .from(weeklyCheckIns)
        .where(and(eq(weeklyCheckIns.clientId, targetClientId), eq(weeklyCheckIns.weekNumber, week)))
        .limit(1);

      return NextResponse.json({
        ok: true,
        prompts: WEEKLY_CHECK_IN_PROMPTS,
        checkIn: row
          ? {
              weekNumber: row.weekNumber,
              weekStartIso: row.weekStartIso,
              answers: parseWeeklyCheckInAnswers(row.answersJson),
              submittedAt: row.submittedAt.toISOString(),
            }
          : null,
      });
    }

    const rows = (await db
      .select()
      .from(weeklyCheckIns)
      .where(eq(weeklyCheckIns.clientId, targetClientId))
      .orderBy(desc(weeklyCheckIns.weekNumber))
      .limit(12)) as Array<typeof weeklyCheckIns.$inferSelect>;

    return NextResponse.json({
      ok: true,
      prompts: WEEKLY_CHECK_IN_PROMPTS,
      checkIns: rows.map((row) => ({
        id: row.id,
        weekNumber: row.weekNumber,
        weekStartIso: row.weekStartIso,
        answers: parseWeeklyCheckInAnswers(row.answersJson),
        summary: formatWeeklyCheckInSummary(parseWeeklyCheckInAnswers(row.answersJson)),
        submittedAt: row.submittedAt.toISOString(),
      })),
    });
  } catch (err) {
    logError('weekly_checkin_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
    }

    const { answers, weekNumber, weekStartIso } = parsed.data;
    if (!answers.q1.trim() && !answers.q2.trim() && !answers.q3.trim()) {
      return NextResponse.json({ error: 'answers_required' }, { status: 400 });
    }

    const now = new Date();
    const db = getDb();
    const payload = JSON.stringify(answers);

    const [existing] = await db
      .select({ id: weeklyCheckIns.id })
      .from(weeklyCheckIns)
      .where(and(eq(weeklyCheckIns.clientId, user.id), eq(weeklyCheckIns.weekNumber, weekNumber)))
      .limit(1);

    if (existing) {
      await db
        .update(weeklyCheckIns)
        .set({
          weekStartIso,
          answersJson: payload,
          submittedAt: now,
        })
        .where(eq(weeklyCheckIns.id, existing.id));
    } else {
      await db.insert(weeklyCheckIns).values({
        id: randomUUID(),
        clientId: user.id,
        weekNumber,
        weekStartIso,
        answersJson: payload,
        submittedAt: now,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('weekly_checkin_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

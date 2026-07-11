import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { dailyScheduleFeedback } from '@/db/schema';
import { assertCounselorForClient } from '@/lib/client-access';
import { localDateIso } from '@/lib/daily-layer';
import { logError } from '@/lib/logger';
import { canAccessProviderConsole } from '@/lib/provider-console-access';
import { getUserFromRequest } from '@/lib/session';

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  workedText: z.string().max(2000).optional(),
  didntWorkText: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dateIso = searchParams.get('date') ?? localDateIso();
    const clientId = searchParams.get('clientId');
    const db = getDb();

    let targetClientId = user.id;
    if (canAccessProviderConsole(user) && user.role !== 'client') {
      if (!clientId) return NextResponse.json({ error: 'clientId_required' }, { status: 400 });
      if (!(await assertCounselorForClient(user.id, clientId))) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      targetClientId = clientId;
    } else if (user.role !== 'client') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const [row] = await db
      .select()
      .from(dailyScheduleFeedback)
      .where(
        and(
          eq(dailyScheduleFeedback.clientId, targetClientId),
          eq(dailyScheduleFeedback.dateIso, dateIso),
        ),
      )
      .limit(1);

    return NextResponse.json({
      ok: true,
      feedback: row
        ? {
            workedText: row.workedText,
            didntWorkText: row.didntWorkText,
            submittedAt: row.submittedAt.toISOString(),
          }
        : null,
    });
  } catch (err) {
    logError('daily_feedback_get_error', err);
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

    if (!parsed.data.workedText?.trim() && !parsed.data.didntWorkText?.trim()) {
      return NextResponse.json({ error: 'text_required' }, { status: 400 });
    }

    const dateIso = parsed.data.date ?? localDateIso();
    const now = new Date();
    const db = getDb();

    const [existing] = await db
      .select({ id: dailyScheduleFeedback.id })
      .from(dailyScheduleFeedback)
      .where(
        and(
          eq(dailyScheduleFeedback.clientId, user.id),
          eq(dailyScheduleFeedback.dateIso, dateIso),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(dailyScheduleFeedback)
        .set({
          workedText: parsed.data.workedText?.trim() ?? null,
          didntWorkText: parsed.data.didntWorkText?.trim() ?? null,
          submittedAt: now,
        })
        .where(eq(dailyScheduleFeedback.id, existing.id));
    } else {
      await db.insert(dailyScheduleFeedback).values({
        id: randomUUID(),
        clientId: user.id,
        dateIso,
        workedText: parsed.data.workedText?.trim() ?? null,
        didntWorkText: parsed.data.didntWorkText?.trim() ?? null,
        submittedAt: now,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('daily_feedback_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { holisticCompletions } from '@/db/schema';
import { assertCounselorForClient } from '@/lib/client-access';
import { localDateIso } from '@/lib/daily-layer';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const HOLISTIC_TYPES = ['ayurveda', 'yoga', 'music', 'practice'] as const;

const postSchema = z.object({
  activityType: z.enum(HOLISTIC_TYPES),
  weekNumber: z.number().int().min(1).max(6),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
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
    if (user.role === 'provider') {
      if (!clientId) return NextResponse.json({ error: 'clientId_required' }, { status: 400 });
      if (!(await assertCounselorForClient(user.id, clientId))) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      targetClientId = clientId;
    } else if (user.role !== 'client') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const rows = (await db
      .select()
      .from(holisticCompletions)
      .where(
        and(
          eq(holisticCompletions.clientId, targetClientId),
          eq(holisticCompletions.dateIso, dateIso),
        ),
      )) as {
      activityType: string;
      weekNumber: number;
      notes: string | null;
      completedAt: Date;
    }[];

    const completed: Record<string, boolean> = {};
    for (const type of HOLISTIC_TYPES) {
      completed[type] = rows.some((r) => r.activityType === type);
    }

    return NextResponse.json({
      ok: true,
      date: dateIso,
      completed,
      entries: rows.map((r) => ({
        activityType: r.activityType,
        weekNumber: r.weekNumber,
        notes: r.notes,
        completedAt: r.completedAt.toISOString(),
      })),
    });
  } catch (err) {
    logError('holistic_completions_get_error', err);
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

    const dateIso = parsed.data.date ?? localDateIso();
    const now = new Date();
    const db = getDb();

    const [existing] = (await db
      .select({ id: holisticCompletions.id })
      .from(holisticCompletions)
      .where(
        and(
          eq(holisticCompletions.clientId, user.id),
          eq(holisticCompletions.dateIso, dateIso),
          eq(holisticCompletions.activityType, parsed.data.activityType),
        ),
      )
      .limit(1)) as { id: string }[];

    if (existing) {
      await db
        .update(holisticCompletions)
        .set({
          weekNumber: parsed.data.weekNumber,
          notes: parsed.data.notes ?? null,
          completedAt: now,
        })
        .where(eq(holisticCompletions.id, existing.id));
      return NextResponse.json({ ok: true, id: existing.id });
    }

    const id = randomUUID();
    await db.insert(holisticCompletions).values({
      id,
      clientId: user.id,
      dateIso,
      weekNumber: parsed.data.weekNumber,
      activityType: parsed.data.activityType,
      notes: parsed.data.notes ?? null,
      completedAt: now,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    logError('holistic_completions_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

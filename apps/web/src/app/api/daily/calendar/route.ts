import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { dailyCalendarEntries } from '@/db/schema';
import { assertCounselorForClient } from '@/lib/client-access';
import { localDateIso, parseCalendarBlocks, type CalendarBlock } from '@/lib/daily-layer';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const putSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  blocks: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['practice', 'reinforcement', 'rest', 'work_break', 'music', 'custom']),
      label: z.string(),
      plannedTime: z.string().optional(),
      status: z.enum(['planned', 'done', 'partial', 'skipped']),
    }),
  ),
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

    const [entry] = await db
      .select()
      .from(dailyCalendarEntries)
      .where(
        and(
          eq(dailyCalendarEntries.clientId, targetClientId),
          eq(dailyCalendarEntries.dateIso, dateIso),
        ),
      )
      .limit(1);

    return NextResponse.json({
      ok: true,
      date: dateIso,
      blocks: entry ? parseCalendarBlocks(entry.blocks) : [],
    });
  } catch (err) {
    logError('daily_calendar_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const parsed = putSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
    }

    const dateIso = parsed.data.date ?? localDateIso();
    const blocks = parsed.data.blocks as CalendarBlock[];
    const now = new Date();
    const db = getDb();

    const [existing] = await db
      .select({ id: dailyCalendarEntries.id })
      .from(dailyCalendarEntries)
      .where(
        and(
          eq(dailyCalendarEntries.clientId, user.id),
          eq(dailyCalendarEntries.dateIso, dateIso),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(dailyCalendarEntries)
        .set({ blocks: JSON.stringify(blocks), updatedAt: now })
        .where(eq(dailyCalendarEntries.id, existing.id));
    } else {
      await db.insert(dailyCalendarEntries).values({
        id: randomUUID(),
        clientId: user.id,
        dateIso,
        blocks: JSON.stringify(blocks),
        updatedAt: now,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('daily_calendar_put_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

import { randomUUID } from 'node:crypto';

import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { dailyReinforcements, reinforcementResponses } from '@/db/schema';
import { assertCounselorForClient } from '@/lib/client-access';
import { isDateInRange, localDateIso } from '@/lib/daily-layer';
import { logError } from '@/lib/logger';
import { resolveCounselorAudioUrl } from '@/lib/reinforcement-audio';
import { getUserFromRequest } from '@/lib/session';

type ReinforcementRow = {
  id: string;
  title: string;
  bodyText: string;
  counselorAudioUrl: string | null;
  planWeek: number | null;
  startDate: string;
  endDate: string;
};

const createSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1).max(200),
  bodyText: z.string().min(1).max(4000),
  counselorAudioUrl: z.string().url().optional(),
  counselorAudioBase64: z.string().max(900_000).optional(),
  counselorAudioMime: z.string().max(40).optional(),
  planWeek: z.number().int().min(1).max(6).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dateIso = searchParams.get('date') ?? localDateIso();
    const clientId = searchParams.get('clientId');
    const db = getDb();

    if (user.role === 'client') {
      const rows: ReinforcementRow[] = (await db
        .select()
        .from(dailyReinforcements)
        .where(eq(dailyReinforcements.clientId, user.id))
        .orderBy(desc(dailyReinforcements.createdAt))) as ReinforcementRow[];

      const active = rows.filter((r) => isDateInRange(dateIso, r.startDate, r.endDate));

      const todayReadouts = await Promise.all(
        active.map(async (row) => {
          const responses = (await db
            .select()
            .from(reinforcementResponses)
            .where(
              and(
                eq(reinforcementResponses.reinforcementId, row.id),
                eq(reinforcementResponses.clientId, user.id),
              ),
            )) as { submittedAt: Date }[];
          const respondedToday = responses.some((r) => localDateIso(r.submittedAt) === dateIso);
          return {
            id: row.id,
            title: row.title,
            bodyText: row.bodyText,
            counselorAudioUrl: row.counselorAudioUrl,
            planWeek: row.planWeek,
            respondedToday,
          };
        }),
      );

      return NextResponse.json({
        ok: true,
        today: todayReadouts[0] ?? null,
        todayReadouts,
        all: rows.map((r) => ({
          id: r.id,
          title: r.title,
          bodyText: r.bodyText,
          planWeek: r.planWeek,
          startDate: r.startDate,
          endDate: r.endDate,
        })),
      });
    }

    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const targetClientId = clientId ?? user.id;
    if (clientId && !(await assertCounselorForClient(user.id, clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const rows: ReinforcementRow[] = (await db
      .select()
      .from(dailyReinforcements)
      .where(eq(dailyReinforcements.clientId, targetClientId))
      .orderBy(desc(dailyReinforcements.createdAt))) as ReinforcementRow[];

    const withResponses = await Promise.all(
      rows.map(async (r) => {
        const responses = (await db
          .select()
          .from(reinforcementResponses)
          .where(eq(reinforcementResponses.reinforcementId, r.id))) as { submittedAt: Date }[];
        const respondedToday = responses.some((resp) => localDateIso(resp.submittedAt) === dateIso);
        return {
          id: r.id,
          title: r.title,
          bodyText: r.bodyText,
          counselorAudioUrl: r.counselorAudioUrl,
          hasCounselorAudio: Boolean(r.counselorAudioUrl),
          planWeek: r.planWeek,
          startDate: r.startDate,
          endDate: r.endDate,
          responseCount: responses.length,
          respondedToday,
          isActive: isDateInRange(dateIso, r.startDate, r.endDate),
        };
      }),
    );

    return NextResponse.json({ ok: true, reinforcements: withResponses });
  } catch (err) {
    logError('reinforcements_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
    }

    if (!(await assertCounselorForClient(user.id, parsed.data.clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const now = new Date();
    const start = parsed.data.startDate ?? localDateIso(now);
    const endDate = parsed.data.endDate
      ? new Date(`${parsed.data.endDate}T12:00:00`)
      : new Date(now);
    if (!parsed.data.endDate) endDate.setDate(endDate.getDate() + 6);

    const db = getDb();
    const startIso = start;
    const endIso = parsed.data.endDate ?? localDateIso(endDate);
    const counselorAudioUrl = resolveCounselorAudioUrl({
      counselorAudioUrl: parsed.data.counselorAudioUrl,
      counselorAudioBase64: parsed.data.counselorAudioBase64,
      counselorAudioMime: parsed.data.counselorAudioMime,
    });

    const id = randomUUID();
    await db.insert(dailyReinforcements).values({
      id,
      counselorId: user.id,
      clientId: parsed.data.clientId,
      title: parsed.data.title,
      bodyText: parsed.data.bodyText,
      counselorAudioUrl: counselorAudioUrl ?? null,
      planWeek: parsed.data.planWeek ?? null,
      startDate: startIso,
      endDate: endIso,
      createdAt: now,
    });

    return NextResponse.json({ ok: true, id, updated: false });
  } catch (err) {
    logError('reinforcements_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

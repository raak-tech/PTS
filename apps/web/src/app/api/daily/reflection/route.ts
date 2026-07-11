import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { eveningReflections } from '@/db/schema';
import { assertCounselorForClient } from '@/lib/client-access';
import { localDateIso } from '@/lib/daily-layer';
import { logError } from '@/lib/logger';
import { canAccessProviderConsole } from '@/lib/provider-console-access';
import { getUserFromRequest } from '@/lib/session';

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bodyText: z.string().trim().min(1).max(5000),
});

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dateIso = searchParams.get('date') ?? localDateIso();
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

    const [row] = await db
      .select()
      .from(eveningReflections)
      .where(
        and(eq(eveningReflections.clientId, targetClientId), eq(eveningReflections.dateIso, dateIso)),
      )
      .limit(1);

    return NextResponse.json({
      ok: true,
      reflection: row
        ? {
            bodyText: row.bodyText,
            submittedAt: row.submittedAt.toISOString(),
          }
        : null,
    });
  } catch (err) {
    logError('evening_reflection_get_error', err);
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
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const dateIso = parsed.data.date ?? localDateIso();
    const now = new Date();
    const db = getDb();

    const [existing] = await db
      .select({ id: eveningReflections.id })
      .from(eveningReflections)
      .where(and(eq(eveningReflections.clientId, user.id), eq(eveningReflections.dateIso, dateIso)))
      .limit(1);

    if (existing) {
      await db
        .update(eveningReflections)
        .set({
          bodyText: parsed.data.bodyText,
          submittedAt: now,
        })
        .where(eq(eveningReflections.id, existing.id));
    } else {
      await db.insert(eveningReflections).values({
        id: randomUUID(),
        clientId: user.id,
        dateIso,
        bodyText: parsed.data.bodyText,
        submittedAt: now,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('evening_reflection_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

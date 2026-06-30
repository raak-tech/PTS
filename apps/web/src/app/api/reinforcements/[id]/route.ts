import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { dailyReinforcements } from '@/db/schema';
import { assertCounselorForClient } from '@/lib/client-access';
import { logError } from '@/lib/logger';
import { resolveCounselorAudioUrl } from '@/lib/reinforcement-audio';
import { getUserFromRequest } from '@/lib/session';

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  bodyText: z.string().min(1).max(4000).optional(),
  counselorAudioUrl: z.string().url().optional(),
  counselorAudioBase64: z.string().max(900_000).optional(),
  counselorAudioMime: z.string().max(40).optional(),
  clearCounselorAudio: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .select()
      .from(dailyReinforcements)
      .where(eq(dailyReinforcements.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (!(await assertCounselorForClient(user.id, row.clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const hasAudioField =
      parsed.data.counselorAudioUrl !== undefined ||
      parsed.data.counselorAudioBase64 !== undefined ||
      parsed.data.clearCounselorAudio;

    const counselorAudioUrl = hasAudioField
      ? resolveCounselorAudioUrl({
          counselorAudioUrl: parsed.data.counselorAudioUrl,
          counselorAudioBase64: parsed.data.counselorAudioBase64,
          counselorAudioMime: parsed.data.counselorAudioMime,
          clearCounselorAudio: parsed.data.clearCounselorAudio,
          existing: row.counselorAudioUrl,
        })
      : row.counselorAudioUrl;

    await db
      .update(dailyReinforcements)
      .set({
        title: parsed.data.title ?? row.title,
        bodyText: parsed.data.bodyText ?? row.bodyText,
        counselorAudioUrl,
      })
      .where(eq(dailyReinforcements.id, id));

    return NextResponse.json({
      ok: true,
      id,
      hasCounselorAudio: Boolean(counselorAudioUrl),
    });
  } catch (err) {
    logError('reinforcements_patch_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const db = getDb();
    const [row] = await db
      .select({ clientId: dailyReinforcements.clientId })
      .from(dailyReinforcements)
      .where(eq(dailyReinforcements.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (!(await assertCounselorForClient(user.id, row.clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    await db.delete(dailyReinforcements).where(eq(dailyReinforcements.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('reinforcements_delete_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

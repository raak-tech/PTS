import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { dailyReinforcements, reinforcementResponses } from '@/db/schema';
import { localDateIso } from '@/lib/daily-layer';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const responseSchema = z.object({
  responseType: z.enum(['text', 'voice']),
  bodyText: z.string().max(4000).optional(),
  audioUrl: z.string().url().optional(),
  audioBase64: z.string().max(900_000).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id: reinforcementId } = await context.params;
    const parsed = responseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.responseType === 'text' && !parsed.data.bodyText?.trim()) {
      return NextResponse.json({ error: 'text_required' }, { status: 400 });
    }

    if (parsed.data.responseType === 'voice' && !parsed.data.audioUrl && !parsed.data.audioBase64) {
      return NextResponse.json({ error: 'audio_required' }, { status: 400 });
    }

    const storedAudioUrl =
      parsed.data.audioUrl ??
      (parsed.data.audioBase64 ? `data:audio/mp4;base64,${parsed.data.audioBase64}` : null);

    const db = getDb();
    const [reinforcement] = await db
      .select()
      .from(dailyReinforcements)
      .where(
        and(
          eq(dailyReinforcements.id, reinforcementId),
          eq(dailyReinforcements.clientId, user.id),
        ),
      )
      .limit(1);

    if (!reinforcement) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const today = localDateIso();
    const existing = (await db
      .select()
      .from(reinforcementResponses)
      .where(
        and(
          eq(reinforcementResponses.reinforcementId, reinforcementId),
          eq(reinforcementResponses.clientId, user.id),
        ),
      )) as { submittedAt: Date }[];

    const alreadyToday = existing.some((r) => localDateIso(r.submittedAt) === today);
    if (alreadyToday) {
      return NextResponse.json({ error: 'already_submitted' }, { status: 409 });
    }

    const now = new Date();
    const responseId = randomUUID();
    await db.insert(reinforcementResponses).values({
      id: responseId,
      reinforcementId,
      clientId: user.id,
      responseType: parsed.data.responseType,
      bodyText: parsed.data.bodyText?.trim() ?? null,
      audioUrl: storedAudioUrl,
      submittedAt: now,
    });

    return NextResponse.json({ ok: true, id: responseId });
  } catch (err) {
    logError('reinforcement_response_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

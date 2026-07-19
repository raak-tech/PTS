import { randomUUID } from 'node:crypto';

import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { outcomeMeasures } from '@/db/schema';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { logError } from '@/lib/logger';
import {
  isInstrumentId,
  isMeasurePhase,
  scoreInstrument,
} from '@/lib/outcome-instruments';
import { canAccessProviderConsole } from '@/lib/provider-console-access';
import { getUserFromRequest } from '@/lib/session';

const submitSchema = z.object({
  phase: z.string(),
  instrument: z.string(),
  answers: z.record(z.string(), z.union([z.number(), z.string()])),
});

/**
 * GET own outcome measures (client) or a client's measures (assigned counselor /
 * admin via ?userId). Clinics never call this — they get aggregates only.
 */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');

    let clientId = user.id;
    if (targetUserId && targetUserId !== user.id) {
      if (!canAccessProviderConsole(user)) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const allowed = await assertProviderCanAccessClient(user.id, targetUserId);
      if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      clientId = targetUserId;
    }

    const db = getDb();
    const rows = await db
      .select({
        phase: outcomeMeasures.phase,
        instrument: outcomeMeasures.instrument,
        score: outcomeMeasures.score,
        capturedAt: outcomeMeasures.capturedAt,
      })
      .from(outcomeMeasures)
      .where(eq(outcomeMeasures.userId, clientId));

    return NextResponse.json({
      ok: true,
      measures: rows.map((r) => ({
        phase: r.phase,
        instrument: r.instrument,
        score: r.score,
        capturedAt: r.capturedAt.toISOString(),
      })),
    });
  } catch (err) {
    logError('outcome_measures_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

/** Client submits one instrument. Server scores authoritatively (no trusted score). */
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (user.role !== 'client') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const parsed = submitSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

    const { phase, instrument, answers } = parsed.data;
    if (!isMeasurePhase(phase)) return NextResponse.json({ error: 'invalid_phase' }, { status: 400 });
    if (!isInstrumentId(instrument)) return NextResponse.json({ error: 'invalid_instrument' }, { status: 400 });

    const scored = scoreInstrument(instrument, answers);
    if (!scored.ok) return NextResponse.json({ error: scored.error }, { status: 400 });

    const db = getDb();
    const now = new Date();
    await db
      .insert(outcomeMeasures)
      .values({
        id: randomUUID(),
        userId: user.id,
        phase,
        instrument,
        score: scored.score,
        rawJson: JSON.stringify(scored.normalized),
        capturedAt: now,
      })
      .onConflictDoUpdate({
        target: [outcomeMeasures.userId, outcomeMeasures.phase, outcomeMeasures.instrument],
        set: { score: scored.score, rawJson: JSON.stringify(scored.normalized), capturedAt: now },
      });

    return NextResponse.json({ ok: true, score: scored.score });
  } catch (err) {
    logError('outcome_measures_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

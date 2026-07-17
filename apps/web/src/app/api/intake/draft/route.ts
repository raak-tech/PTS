import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { intakeFlowDrafts } from '@/db/schema';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const draftSchema = z.object({
  version: z.literal(1),
  flow: z.literal('onebox'),
  step: z.enum(['segment', 'onebox', 'confirm', 'follow-up']),
  segmentType: z.string().optional(),
  freeText: z.string().optional(),
  round: z.number().int().min(1).max(5).optional(),
  resultJson: z.string().optional(),
  edits: z.record(z.string(), z.string()).optional(),
  followUpAnswers: z.array(z.string()).optional(),
  followUpStep: z.number().int().min(0).optional(),
  updatedAt: z.string().min(1),
});

const putSchema = z.object({
  draft: draftSchema,
});

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const db = getDb();
    const [row] = await db
      .select()
      .from(intakeFlowDrafts)
      .where(eq(intakeFlowDrafts.userId, user.id))
      .limit(1);

    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    let draft: unknown;
    try {
      draft = JSON.parse(row.payloadJson);
    } catch {
      return NextResponse.json({ error: 'corrupt' }, { status: 500 });
    }

    const parsed = draftSchema.safeParse(draft);
    if (!parsed.success) {
      return NextResponse.json({ error: 'corrupt', detail: parsed.error.flatten() }, { status: 500 });
    }

    return NextResponse.json({ draft: parsed.data });
  } catch (err) {
    logError('intake_draft_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = putSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'invalid', detail: body.error.flatten() }, { status: 400 });
    }

    const { draft } = body.data;
    const updatedAt = new Date(draft.updatedAt);
    const safeUpdatedAt = Number.isNaN(updatedAt.getTime()) ? new Date() : updatedAt;
    const payloadJson = JSON.stringify({ ...draft, updatedAt: safeUpdatedAt.toISOString() });

    const db = getDb();
    await db
      .insert(intakeFlowDrafts)
      .values({
        userId: user.id,
        payloadJson,
        updatedAt: safeUpdatedAt,
      })
      .onConflictDoUpdate({
        target: intakeFlowDrafts.userId,
        set: {
          payloadJson,
          updatedAt: safeUpdatedAt,
        },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('intake_draft_put_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const db = getDb();
    await db.delete(intakeFlowDrafts).where(eq(intakeFlowDrafts.userId, user.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('intake_draft_delete_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

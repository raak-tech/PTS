import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { clientCounselor } from '@/db/schema';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { getUserFromRequest } from '@/lib/session';

const bodySchema = z.object({
  required: z.boolean(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getUserFromRequest(_request);
  if (!user || user.role !== 'provider') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id: clientId } = await context.params;
  if (!(await assertProviderCanAccessClient(user.id, clientId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const db = getDb();
  const [row] = await db
    .select({
      scheduleRequired: clientCounselor.scheduleRequired,
      scheduleRequiredAt: clientCounselor.scheduleRequiredAt,
      scheduleCompletedAt: clientCounselor.scheduleCompletedAt,
    })
    .from(clientCounselor)
    .where(eq(clientCounselor.clientId, clientId))
    .limit(1);

  return NextResponse.json({
    ok: true,
    scheduleRequired: row?.scheduleRequired ?? false,
    scheduleRequiredAt: row?.scheduleRequiredAt?.toISOString() ?? null,
    scheduleCompletedAt: row?.scheduleCompletedAt?.toISOString() ?? null,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'provider') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id: clientId } = await context.params;
  if (!(await assertProviderCanAccessClient(user.id, clientId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const db = getDb();
  const now = new Date();

  const [existing] = await db
    .select({ clientId: clientCounselor.clientId })
    .from(clientCounselor)
    .where(eq(clientCounselor.clientId, clientId))
    .limit(1);

  if (!existing) {
    await db.insert(clientCounselor).values({
      clientId,
      counselorId: user.id,
      assignedAt: now,
      scheduleRequired: parsed.data.required,
      scheduleRequiredAt: parsed.data.required ? now : null,
    });
  } else {
    await db
      .update(clientCounselor)
      .set({
        scheduleRequired: parsed.data.required,
        scheduleRequiredAt: parsed.data.required ? now : null,
        scheduleCompletedAt: parsed.data.required ? null : undefined,
      })
      .where(eq(clientCounselor.clientId, clientId));
  }

  return NextResponse.json({ ok: true, scheduleRequired: parsed.data.required });
}

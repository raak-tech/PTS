import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { clientCounselor, users } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { recordAudit } from '@/lib/audit';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  counselorId: z.string().trim().min(1).nullable(),
});

/** Admin assign / unassign counselor for a client (hybrid ready-pool override). */
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { id: clientId } = await context.params;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const db = getDb();
    const [client] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, clientId))
      .limit(1);
    if (!client || client.role !== 'client') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const { counselorId } = parsed.data;

    if (counselorId === null) {
      await db.delete(clientCounselor).where(eq(clientCounselor.clientId, clientId));
      void recordAudit({
        actorUserId: user!.id,
        actorRole: user!.role,
        action: 'admin_unassign_counselor',
        targetType: 'client',
        targetId: clientId,
      });
      return NextResponse.json({ ok: true, counselorId: null });
    }

    const [counselor] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, counselorId))
      .limit(1);
    if (!counselor || counselor.role !== 'provider') {
      return NextResponse.json({ error: 'invalid_counselor' }, { status: 400 });
    }

    const [existing] = await db
      .select({ clientId: clientCounselor.clientId })
      .from(clientCounselor)
      .where(eq(clientCounselor.clientId, clientId))
      .limit(1);

    const now = new Date();
    if (existing) {
      await db
        .update(clientCounselor)
        .set({ counselorId, assignedAt: now })
        .where(eq(clientCounselor.clientId, clientId));
    } else {
      await db.insert(clientCounselor).values({
        clientId,
        counselorId,
        assignedAt: now,
      });
    }

    void recordAudit({
      actorUserId: user!.id,
      actorRole: user!.role,
      action: 'admin_assign_counselor',
      targetType: 'client',
      targetId: clientId,
      metadata: { counselorId },
    });

    return NextResponse.json({ ok: true, counselorId });
  } catch (err) {
    logError('admin_assign_counselor_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

/** List providers for the admin assign dropdown. */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const counselors = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.role, 'provider'))
      .orderBy(users.email);

    return NextResponse.json({
      ok: true,
      counselors: counselors.map((c) => ({
        id: c.id,
        label: c.displayName || c.email,
        email: c.email,
      })),
    });
  } catch (err) {
    logError('admin_list_counselors_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

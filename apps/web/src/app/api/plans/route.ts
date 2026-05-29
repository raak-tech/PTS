import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { clientCounselor, plans } from '@/db/schema';
import { logError } from '@/lib/logger';
import { getUserFromCookieHeader } from '@/lib/session';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

// GET /api/plans?userId=<id>  — counselor fetches a client's plan
// GET /api/plans               — client fetches their own plan
export async function GET(request: Request) {
  try {
    const user = await getUserFromCookieHeader(request.headers.get('cookie'));
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const targetUserId = user.role === 'provider'
      ? (searchParams.get('userId') ?? user.id)
      : user.id;

    const db = getDb();
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.userId, targetUserId))
      .orderBy(plans.createdAt)
      .limit(1);

    return NextResponse.json({ ok: true, plan: plan ?? null });
  } catch (err) {
    logError('plans_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

const approveSchema = z.object({
  planId: z.string().min(1),
  counselorNotes: z.string().max(2000).optional(),
  action: z.enum(['approve', 'regenerate']),
});

// POST /api/plans  — counselor approves or requests regeneration
export async function POST(request: Request) {
  try {
    const user = await getUserFromCookieHeader(request.headers.get('cookie'));
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const parsed = approveSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    const db = getDb();
    const now = new Date();

    if (parsed.data.action === 'approve') {
      const [updated] = await db
        .update(plans)
        .set({
          status: 'approved',
          counselorId: user.id,
          counselorNotes: parsed.data.counselorNotes ?? null,
          approvedAt: now,
          approvedBy: user.id,
        })
        .where(eq(plans.id, parsed.data.planId))
        .returning({ userId: plans.userId });

      // Create client-counselor assignment so messaging works immediately
      if (updated) {
        await db
          .insert(clientCounselor)
          .values({ clientId: updated.userId, counselorId: user.id, assignedAt: now })
          .onConflictDoUpdate({ target: clientCounselor.clientId, set: { counselorId: user.id, assignedAt: now } });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'unsupported action' }, { status: 400 });
  } catch (err) {
    logError('plans_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

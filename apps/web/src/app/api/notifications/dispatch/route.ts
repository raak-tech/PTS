import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { sendPushToUser } from '@/lib/expo-push';
import { getUserFromRequest } from '@/lib/session';

// POST /api/notifications/dispatch
// Manually send a push notification to a user.
// Auth: admin or provider only.
// Body: { userId, title, body, data? }
export async function POST(request: Request) {
  const caller = await getUserFromRequest(request);
  if (!caller || (caller.role !== 'admin' && caller.role !== 'provider')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json() as {
    userId?: string;
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  };

  if (!body.userId || !body.title || !body.body) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const db = getDb();
  const [target] = await db
    .select({ expoPushToken: users.expoPushToken })
    .from(users)
    .where(eq(users.id, body.userId))
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
  }

  const result = await sendPushToUser(
    target.expoPushToken,
    body.title,
    body.body,
    body.data,
  );

  return NextResponse.json({ ok: result.ok, ticketId: result.ticketId });
}

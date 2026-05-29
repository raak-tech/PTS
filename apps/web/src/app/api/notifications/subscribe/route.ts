import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { pushSubscriptions, users } from '@/db/schema';
import { getUserFromCookieHeader } from '@/lib/session';
import { logError, log } from '@/lib/logger';

const schema = z.object({
  endpoint: z.string().url(),
  auth: z.string(),
  p256dh: z.string(),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromCookieHeader(request.headers.get('cookie'));
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date();

    // Save subscription
    await db.insert(pushSubscriptions).values({
      id: randomUUID(),
      userId: user.id,
      endpoint: parsed.data.endpoint,
      auth: parsed.data.auth,
      p256dh: parsed.data.p256dh,
      createdAt: now,
    }).onConflictDoNothing();

    // Enable notifications on user
    await db.update(users).set({ notificationsEnabled: true }).where(eq(users.id, user.id));

    log('push_subscribed', { userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('notification_subscribe_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromCookieHeader(request.headers.get('cookie'));
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { endpoint } = await request.json() as { endpoint?: string };
    if (!endpoint) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    const db = getDb();
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id));

    log('push_unsubscribed', { userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('notification_unsubscribe_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

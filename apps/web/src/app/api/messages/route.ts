import { randomUUID } from 'node:crypto';

import { and, eq, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { messages, users } from '@/db/schema';
import { logError } from '@/lib/logger';
import { getUserFromCookieHeader } from '@/lib/session';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

// GET /api/messages?with=<userId>  — fetch thread between current user and <userId>
export async function GET(request: Request) {
  try {
    const user = await getUserFromCookieHeader(request.headers.get('cookie'));
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get('with');
    if (!withUserId) return NextResponse.json({ error: 'missing ?with param' }, { status: 400 });

    const db = getDb();

    // Mark messages to this user as read
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(and(eq(messages.toUserId, user.id), eq(messages.fromUserId, withUserId)));

    const thread = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.fromUserId, user.id), eq(messages.toUserId, withUserId)),
          and(eq(messages.fromUserId, withUserId), eq(messages.toUserId, user.id)),
        ),
      )
      .orderBy(messages.createdAt);

    return NextResponse.json({ ok: true, messages: thread });
  } catch (err) {
    logError('messages_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

const sendSchema = z.object({
  toUserId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
});

// POST /api/messages  — send a message
export async function POST(request: Request) {
  try {
    const user = await getUserFromCookieHeader(request.headers.get('cookie'));
    if (!user) return unauthorized();

    const parsed = sendSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    // Verify recipient exists
    const db = getDb();
    const [recipient] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, parsed.data.toUserId))
      .limit(1);

    if (!recipient) return NextResponse.json({ error: 'recipient-not-found' }, { status: 404 });

    const now = new Date();
    await db.insert(messages).values({
      id: randomUUID(),
      fromUserId: user.id,
      toUserId: parsed.data.toUserId,
      body: parsed.data.body,
      createdAt: now,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('messages_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

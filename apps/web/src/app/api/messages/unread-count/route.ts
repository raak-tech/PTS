import { and, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { messages } from '@/db/schema';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const unread = await db
      .select({
        fromUserId: messages.fromUserId,
      })
      .from(messages)
      .where(and(eq(messages.toUserId, user.id), isNull(messages.readAt)));

    const counts: Record<string, number> = {};
    for (const row of unread) {
      counts[row.fromUserId] = (counts[row.fromUserId] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      total: unread.length,
      counts,
    });
  } catch (err) {
    logError('messages_unread_count_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { getUserFromRequest } from '@/lib/session';

// POST /api/notifications/register-token
// Called by the mobile app after Expo push token is obtained.
// Body: { expoPushToken: string }
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json() as { expoPushToken?: string };
  const token = body.expoPushToken?.trim();

  if (!token || !token.startsWith('ExponentPushToken')) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }

  const db = getDb();
  await db.update(users).set({ expoPushToken: token }).where(eq(users.id, user.id));

  console.log('[notify] Registered push token for user', user.id);
  return NextResponse.json({ ok: true });
}

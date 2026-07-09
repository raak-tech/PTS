import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { sessions } from '@/db/schema';
import { hashToken } from '@/lib/auth';
import { readSessionToken } from '@/lib/session';

export async function POST(request: Request) {
  const token = readSessionToken(request);
  if (!token) {
    return NextResponse.json({ ok: true });
  }

  await getDb()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, hashToken(token)));

  return NextResponse.json({ ok: true });
}

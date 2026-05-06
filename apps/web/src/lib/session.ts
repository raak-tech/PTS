import { eq } from 'drizzle-orm';

import { getDb } from '../db';
import { sessions, users } from '../db/schema';
import { hashToken } from './auth';

function readCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;

  for (const chunk of cookieHeader.split(';')) {
    const [rawName, ...rest] = chunk.trim().split('=');
    if (rawName === name) {
      return rest.join('=');
    }
  }

  return undefined;
}

export async function getUserFromCookieHeader(cookieHeader: string | null) {
  const token = readCookieValue(cookieHeader, 'pts_session');
  if (!token) return null;

  const db = getDb();
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ?? null;
}

export function hasSupportCookie(cookieHeader: string | null) {
  return Boolean(readCookieValue(cookieHeader, 'pts_session'));
}

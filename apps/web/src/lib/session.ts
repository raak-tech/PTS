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
  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.tokenHash, hashToken(token)))
    .get();

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  return db.select().from(users).where(eq(users.id, session.userId)).get() ?? null;
}

export function hasSupportCookie(cookieHeader: string | null) {
  return Boolean(readCookieValue(cookieHeader, 'pts_session'));
}

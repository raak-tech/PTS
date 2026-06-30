import { eq } from 'drizzle-orm';

import { getDb } from '../db';
import { sessions, users } from '../db/schema';
import { SESSION_COOKIE_NAME, hashToken } from './auth';

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

export function readSessionToken(request: Request): string | undefined {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return readCookieValue(request.headers.get('cookie'), SESSION_COOKIE_NAME);
}

async function getUserFromToken(token: string) {
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

export async function getUserFromRequest(request: Request) {
  const token = readSessionToken(request);
  if (!token) return null;
  return getUserFromToken(token);
}

export async function getUserFromCookieHeader(cookieHeader: string | null) {
  const token = readCookieValue(cookieHeader, SESSION_COOKIE_NAME);
  if (!token) return null;
  return getUserFromToken(token);
}

export function hasSupportCookie(cookieHeader: string | null) {
  return Boolean(readCookieValue(cookieHeader, SESSION_COOKIE_NAME));
}

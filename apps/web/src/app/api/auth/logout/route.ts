import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { clearSessionCookie } from '@/lib/cookies';
import { hashToken } from '@/lib/auth';
import { logError } from '@/lib/logger';
import { getDb } from '@/db';
import { sessions } from '@/db/schema';

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

async function logout(request: Request) {
  try {
    const cookieValue = readCookieValue(request.headers.get('cookie'), 'pts_session');
    if (cookieValue) {
      const db = getDb();
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(eq(sessions.tokenHash, hashToken(cookieValue)));
    }
  } catch (err) {
    // Best-effort: always clear the cookie even if DB revocation fails.
    logError('logout_revoke_error', err);
  }

  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.cookies.set(clearSessionCookie());
  return response;
}

export async function POST(request: Request) {
  return logout(request);
}

export async function GET(request: Request) {
  return logout(request);
}

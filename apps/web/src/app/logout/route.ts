import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { clearSessionCookie } from '@/lib/cookies';
import { hashToken } from '@/lib/auth';
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
  const cookieValue = readCookieValue(request.headers.get('cookie'), 'pts_session');
  if (cookieValue) {
    const db = getDb();
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, hashToken(cookieValue)));
  }

  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.cookies.set(clearSessionCookie());
  return response;
}

/**
 * GET must not revoke sessions — Next.js <Link> prefetch would sign users out.
 * Show a tiny confirm page that POSTs, or redirect to login without clearing.
 */
export async function GET(request: Request) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Sign out</title>
<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#fafafa;margin:0}
form{background:#fff;padding:28px 24px;border-radius:16px;border:2px solid #ddd;max-width:360px;text-align:center}
button{padding:12px 20px;border-radius:999px;border:none;background:#111;color:#fff;font-weight:700;cursor:pointer;font-size:15px}
a{display:block;margin-top:14px;color:#555;font-size:14px}</style></head><body>
<form method="post" action="/logout"><p style="margin:0 0 16px;font-size:16px;font-weight:600">Sign out of PTS?</p>
<button type="submit">Sign out</button>
<a href="/provider/clients">Cancel</a></form></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(request: Request) {
  return logout(request);
}

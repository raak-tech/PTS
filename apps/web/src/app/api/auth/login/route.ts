import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createSessionCookie } from '@/lib/cookies';
import {
  createSessionToken,
  hashToken,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
} from '@/lib/auth';
import { logError } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { getDb } from '@/db';
import { sessions, users } from '@/db/schema';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

function errorRedirect(request: Request, message: string) {
  const url = new URL('/login', request.url);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const rl = checkRateLimit(`login:${ip}`);
    if (rl.limited) {
      return NextResponse.json(
        { error: 'too-many-requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    const formData = await request.formData();
    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!parsed.success) {
      return errorRedirect(request, 'invalid');
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);

    if (!user) {
      return errorRedirect(request, 'invalid');
    }

    const ok = await verifyPassword(user.passwordHash, parsed.data.password);
    if (!ok) {
      return errorRedirect(request, 'invalid');
    }

    const now = new Date();
    const sessionToken = createSessionToken();
    const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

    await db.insert(sessions).values({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(sessionToken),
      createdAt: now,
      expiresAt,
    });

    const dest = user.role === 'provider' ? '/provider' : '/';
    const response = NextResponse.redirect(new URL(dest, request.url), 303);
    response.cookies.set(createSessionCookie(sessionToken));
    return response;
  } catch (err) {
    logError('login_error', err);
    return errorRedirect(request, 'server');
  }
}

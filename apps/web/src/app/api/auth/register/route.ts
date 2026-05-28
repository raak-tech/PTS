import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createSessionCookie } from '@/lib/cookies';
import {
  createSessionToken,
  hashPassword,
  hashToken,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';
import { logError } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { getDb } from '@/db';
import { sessions, users } from '@/db/schema';

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(80).optional(),
  next: z.string().optional(),
});

function errorRedirect(request: Request, message: string) {
  const url = new URL('/register', request.url);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const rl = checkRateLimit(`register:${ip}`);
    if (rl.limited) {
      return NextResponse.json(
        { error: 'too-many-requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    const formData = await request.formData();
    const parsed = registerSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      displayName: formData.get('displayName') ?? undefined,
      next: formData.get('next') ?? undefined,
    });

    if (!parsed.success) {
      return errorRedirect(request, 'invalid');
    }

    const db = getDb();
    const [existing] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);

    if (existing) {
      return errorRedirect(request, 'duplicate');
    }

    const now = new Date();
    const userId = randomUUID();
    const sessionToken = createSessionToken();
    const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

    await db.insert(users).values({
      id: userId,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: 'client',
      displayName: parsed.data.displayName ?? null,
      createdAt: now,
    });

    await db.insert(sessions).values({
      id: randomUUID(),
      userId,
      tokenHash: hashToken(sessionToken),
      createdAt: now,
      expiresAt,
    });

    const redirectTo = parsed.data.next ?? '/';
    const response = NextResponse.redirect(new URL(redirectTo, request.url), 303);
    response.cookies.set(createSessionCookie(sessionToken));
    return response;
  } catch (err) {
    logError('register_error', err);
    return errorRedirect(request, 'server');
  }
}

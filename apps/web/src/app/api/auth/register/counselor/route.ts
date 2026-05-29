import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createSessionCookie } from '@/lib/cookies';
import { createSessionToken, hashPassword, hashToken, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/logger';
import { getDb } from '@/db';
import { counselorProfiles, sessions, users } from '@/db/schema';

const schema = z.object({
  inviteCode: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(120),
  credentials: z.string().trim().max(500).optional(),
  yearsExperience: z.string().min(1),
  specialisations: z.union([z.string(), z.array(z.string())]).transform(v =>
    Array.isArray(v) ? v : [v]
  ),
  languages: z.union([z.string(), z.array(z.string())]).transform(v =>
    Array.isArray(v) ? v : [v]
  ),
  bio: z.string().trim().min(20).max(1500),
  calendlyUrl: z.string().trim().url().optional(),
});

function errorRedirect(request: Request, code: string) {
  const url = new URL('/register/counselor', request.url);
  url.searchParams.set('error', code);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const rl = checkRateLimit(`counselor-register:${ip}`, 3, 60 * 60 * 1000);
    if (rl.limited) {
      return NextResponse.json({ error: 'too-many-requests' }, { status: 429 });
    }

    const formData = await request.formData();

    // Collect multi-value checkbox fields
    const specialisations = formData.getAll('specialisations') as string[];
    const languages = formData.getAll('languages') as string[];

    const parsed = schema.safeParse({
      inviteCode: formData.get('inviteCode'),
      email: formData.get('email'),
      password: formData.get('password'),
      fullName: formData.get('fullName'),
      title: formData.get('title'),
      credentials: formData.get('credentials') || undefined,
      yearsExperience: formData.get('yearsExperience'),
      specialisations: specialisations.length > 0 ? specialisations : [],
      languages: languages.length > 0 ? languages : [],
      bio: formData.get('bio'),
      calendlyUrl: formData.get('calendlyUrl') || undefined,
    });

    if (!parsed.success) {
      return errorRedirect(request, 'invalid');
    }

    // Validate invite code against env var
    const validCode = process.env.COUNSELOR_INVITE_CODE;
    if (!validCode || parsed.data.inviteCode.trim().toUpperCase() !== validCode.trim().toUpperCase()) {
      return errorRedirect(request, 'invalid-code');
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
      role: 'provider',
      displayName: parsed.data.fullName,
      createdAt: now,
    });

    await db.insert(counselorProfiles).values({
      userId,
      fullName: parsed.data.fullName,
      title: parsed.data.title,
      credentials: parsed.data.credentials ?? null,
      specialisations: JSON.stringify(parsed.data.specialisations),
      languages: JSON.stringify(parsed.data.languages),
      yearsExperience: parsed.data.yearsExperience,
      bio: parsed.data.bio,
      calendlyUrl: parsed.data.calendlyUrl ?? null,
      createdAt: now,
    });

    await db.insert(sessions).values({
      id: randomUUID(),
      userId,
      tokenHash: hashToken(sessionToken),
      createdAt: now,
      expiresAt,
    });

    const response = NextResponse.redirect(new URL('/provider', request.url), 303);
    response.cookies.set(createSessionCookie(sessionToken));
    return response;
  } catch (err) {
    logError('counselor_register_error', err);
    return errorRedirect(request, 'server');
  }
}

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { userConsents, users } from '@/db/schema';
import { createUserSession } from '@/lib/create-session';
import { buildMobileSessionUser } from '@/lib/mobile-user';
import { checkOtpVerifyLimit, verifyOtpCode } from '@/lib/otp';
import { isValidIndianMobile, normalizePhone } from '@/lib/phone';

const schema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().trim().min(4).max(8),
  dataStorageConsent: z.boolean().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!isValidIndianMobile(phone)) {
    return NextResponse.json({ error: 'invalid-phone' }, { status: 400 });
  }

  const limit = await checkOtpVerifyLimit(phone);
  if (limit.limited) {
    return NextResponse.json(
      { error: 'too-many-requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const verified = await verifyOtpCode(phone, parsed.data.code);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 401 });
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    return NextResponse.json({ error: 'not-registered' }, { status: 404 });
  }

  if (parsed.data.dataStorageConsent) {
    const now = new Date();
    await db
      .insert(userConsents)
      .values({
        userId: user.id,
        dataStorageEnabled: true,
        enabledAt: now,
      })
      .onConflictDoUpdate({
        target: userConsents.userId,
        set: { dataStorageEnabled: true, enabledAt: now, revokedAt: null },
      });
  }

  const { token } = await createUserSession(user.id);
  const sessionUser = await buildMobileSessionUser(user.id);
  if (!sessionUser) {
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }

  return NextResponse.json({ token, user: sessionUser });
}

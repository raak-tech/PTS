import { NextResponse } from 'next/server';
import { z } from 'zod';

import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { checkOtpSendLimit, createAndSendOtp } from '@/lib/otp';
import { isValidIndianMobile, normalizePhone } from '@/lib/phone';

const schema = z.object({
  phone: z.string().min(8).max(20),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid-phone' }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!isValidIndianMobile(phone)) {
    return NextResponse.json({ error: 'invalid-phone' }, { status: 400 });
  }

  const db = getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    return NextResponse.json({ error: 'not-registered' }, { status: 404 });
  }

  const limit = await checkOtpSendLimit(phone);
  if (limit.limited) {
    return NextResponse.json(
      { error: 'too-many-requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const result = await createAndSendOtp(phone);
  if (!result.ok) {
    return NextResponse.json({ error: 'sms-failed' }, { status: 502 });
  }

  return NextResponse.json({ sent: true, phone: result.phone });
}

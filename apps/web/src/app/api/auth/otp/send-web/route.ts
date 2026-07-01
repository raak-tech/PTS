import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { checkOtpSendLimit, createAndSendOtp } from '@/lib/otp';
import { isValidIndianMobile, normalizePhone } from '@/lib/phone';

const schema = z.object({
  phone: z.string().min(8).max(20),
  next: z.string().optional(),
});

function safeNextPath(next?: string) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/intake';
  return next;
}

function redirectWith(request: Request, params: Record<string, string>) {
  const url = new URL('/login/mobile', request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = schema.safeParse({
    phone: formData.get('phone'),
    next: formData.get('next') || undefined,
  });

  if (!parsed.success) {
    return redirectWith(request, { error: 'invalid-phone' });
  }

  const phone = normalizePhone(parsed.data.phone);
  const next = safeNextPath(parsed.data.next);

  if (!isValidIndianMobile(phone)) {
    return redirectWith(request, { error: 'invalid-phone', phone: parsed.data.phone, next });
  }

  const db = getDb();
  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (!user) {
    return redirectWith(request, { error: 'not-registered', phone: parsed.data.phone, next });
  }

  if (user.role === 'client') {
    return redirectWith(request, { error: 'client-mobile-only', phone: parsed.data.phone, next });
  }

  const limit = await checkOtpSendLimit(phone);
  if (limit.limited) {
    return redirectWith(request, { error: 'too-many-requests', phone: parsed.data.phone, next });
  }

  const result = await createAndSendOtp(phone);
  if (!result.ok) {
    return redirectWith(request, { error: 'sms-failed', phone: parsed.data.phone, next });
  }

  return redirectWith(request, { sent: '1', phone: parsed.data.phone, next });
}

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { createSessionCookie } from '@/lib/cookies';
import { createUserSession } from '@/lib/create-session';
import { checkOtpVerifyLimit, verifyOtpCode } from '@/lib/otp';
import { isValidIndianMobile, normalizePhone } from '@/lib/phone';

const schema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().trim().min(4).max(8),
  next: z.string().optional(),
});

function safeNextPath(next?: string) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/intake';
  return next;
}

function errorRedirect(request: Request, code: string, phone?: string, next?: string) {
  const url = new URL('/login/mobile', request.url);
  url.searchParams.set('error', code);
  if (phone) url.searchParams.set('phone', phone);
  if (next) url.searchParams.set('next', safeNextPath(next));
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = schema.safeParse({
    phone: formData.get('phone'),
    code: formData.get('code'),
    next: formData.get('next') || undefined,
  });

  if (!parsed.success) {
    return errorRedirect(request, 'invalid', undefined, formData.get('next')?.toString());
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!isValidIndianMobile(phone)) {
    return errorRedirect(request, 'invalid-phone', parsed.data.phone, parsed.data.next);
  }

  const limit = await checkOtpVerifyLimit(phone);
  if (limit.limited) {
    return errorRedirect(request, 'too-many-requests', parsed.data.phone, parsed.data.next);
  }

  const verified = await verifyOtpCode(phone, parsed.data.code);
  if (!verified.ok) {
    return errorRedirect(request, verified.error, parsed.data.phone, parsed.data.next);
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    return errorRedirect(request, 'not-registered', parsed.data.phone, parsed.data.next);
  }

  const { token } = await createUserSession(user.id);
  const explicitNext = parsed.data.next?.trim();
  const dest =
    explicitNext && explicitNext.startsWith('/') && !explicitNext.startsWith('//')
      ? explicitNext
      : user.role === 'provider'
        ? '/provider'
        : user.role === 'admin'
          ? '/admin'
          : '/intake';
  const response = NextResponse.redirect(new URL(dest, request.url), 303);
  response.cookies.set(createSessionCookie(token));
  return response;
}

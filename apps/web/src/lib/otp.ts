import { randomUUID } from 'node:crypto';

import { and, desc, eq, gte, isNull } from 'drizzle-orm';

import { getDb } from '@/db';
import { otpCodes } from '@/db/schema';
import { generateOtpCode, sendOtpViaMSG91 } from '@/lib/msg91';
import { normalizePhone, usesFixedOtp } from '@/lib/phone';
import { checkRateLimit } from '@/lib/rate-limit';

const DEFAULT_TEST_OTP = '123456';

function fixedOtpCode() {
  return process.env.OTP_FIXED_CODE?.trim() || DEFAULT_TEST_OTP;
}

export async function checkOtpSendLimit(phone: string) {
  const normalized = normalizePhone(phone);
  if (usesFixedOtp(normalized)) {
    return { limited: false as const };
  }

  const mem = checkRateLimit(`otp-send:${phone}`, 5, 60 * 60 * 1000);
  if (mem.limited) {
    return { limited: true as const, retryAfterSeconds: mem.retryAfter ?? 60 };
  }

  const db = getDb();
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db
    .select({ id: otpCodes.id })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, normalized), gte(otpCodes.createdAt, since)));

  if (recent.length >= 5) {
    return { limited: true as const, retryAfterSeconds: 300 };
  }

  return { limited: false as const };
}

export async function checkOtpVerifyLimit(phone: string) {
  const normalized = normalizePhone(phone);
  if (usesFixedOtp(normalized)) {
    return { limited: false as const };
  }

  const mem = checkRateLimit(`otp-verify:${phone}`, 10, 60 * 60 * 1000);
  if (mem.limited) {
    return { limited: true as const, retryAfterSeconds: mem.retryAfter ?? 60 };
  }
  return { limited: false as const };
}

export async function createAndSendOtp(phone: string) {
  const normalized = normalizePhone(phone);
  const fixed = usesFixedOtp(normalized);

  // Pilot / test numbers: no SMS, no DB rows — code is always OTP_FIXED_CODE (default 123456).
  if (fixed) {
    return { ok: true as const, phone: normalized };
  }

  const code = generateOtpCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  const db = getDb();
  await db.insert(otpCodes).values({
    id: randomUUID(),
    phone: normalized,
    code,
    attempts: 0,
    maxAttempts: 10,
    expiresAt,
    createdAt: now,
  });

  const sms = await sendOtpViaMSG91(normalized, code);
  if (!sms.ok) {
    return { ok: false as const, error: sms.error };
  }

  return { ok: true as const, phone: normalized };
}

export async function verifyOtpCode(phone: string, code: string) {
  const normalized = normalizePhone(phone);
  const trimmed = code.trim();

  if (usesFixedOtp(normalized)) {
    if (trimmed === fixedOtpCode()) {
      return { ok: true as const };
    }
    return { ok: false as const, error: 'invalid' as const };
  }

  const db = getDb();

  const [challenge] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, normalized), isNull(otpCodes.consumedAt)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!challenge) {
    return { ok: false as const, error: 'no-code' as const };
  }

  if (challenge.expiresAt <= new Date()) {
    return { ok: false as const, error: 'expired' as const };
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    return { ok: false as const, error: 'too-many-attempts' as const };
  }

  const nextAttempts = challenge.attempts + 1;
  await db.update(otpCodes).set({ attempts: nextAttempts }).where(eq(otpCodes.id, challenge.id));

  if (challenge.code !== trimmed) {
    return { ok: false as const, error: 'invalid' as const };
  }

  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, challenge.id));
  return { ok: true as const };
}

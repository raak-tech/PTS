import { randomUUID } from 'node:crypto';

import { and, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createPasswordResetToken,
  hashToken,
  PASSWORD_RESET_MAX_AGE_SECONDS,
} from '@/lib/auth';
import { recordPasswordResetOutbox } from '@/lib/email-outbox';
import { logError } from '@/lib/logger';
import { getDb } from '@/db';
import { passwordResetTokens, users } from '@/db/schema';

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

function redirectSent(request: Request) {
  const url = new URL('/forgot-password', request.url);
  url.searchParams.set('sent', '1');
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const parsed = requestSchema.safeParse({ email: formData.get('email') });

    if (!parsed.success) {
      return redirectSent(request);
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);

    if (!user) {
      // Always redirect to "sent" — don't disclose whether the email exists.
      return redirectSent(request);
    }

    await db.delete(passwordResetTokens)
      .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));

    const rawToken = createPasswordResetToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PASSWORD_RESET_MAX_AGE_SECONDS * 1000);

    await db.insert(passwordResetTokens)
      .values({
        id: randomUUID(),
        userId: user.id,
        tokenHash: hashToken(rawToken),
        createdAt: now,
        expiresAt,
      });

    const resetUrl = new URL('/reset-password', request.url);
    resetUrl.searchParams.set('token', rawToken);

    await recordPasswordResetOutbox({
      toEmail: user.email,
      resetUrl: resetUrl.toString(),
    });

    return redirectSent(request);
  } catch (err) {
    logError('request_reset_error', err);
    return redirectSent(request);
  }
}

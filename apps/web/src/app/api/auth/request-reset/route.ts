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
  const formData = await request.formData();
  const parsed = requestSchema.safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    return redirectSent(request);
  }

  const db = getDb();
  const user = db.select().from(users).where(eq(users.email, parsed.data.email)).get();

  if (!user) {
    return redirectSent(request);
  }

  db.delete(passwordResetTokens)
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)))
    .run();

  const rawToken = createPasswordResetToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_MAX_AGE_SECONDS * 1000);

  db.insert(passwordResetTokens)
    .values({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(rawToken),
      createdAt: now,
      expiresAt,
    })
    .run();

  const resetUrl = new URL('/reset-password', request.url);
  resetUrl.searchParams.set('token', rawToken);

  recordPasswordResetOutbox({
    toEmail: user.email,
    resetUrl: resetUrl.toString(),
  });

  return redirectSent(request);
}

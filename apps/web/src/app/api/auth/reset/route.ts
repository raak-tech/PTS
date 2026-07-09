import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { hashPassword, hashToken } from '@/lib/auth';
import { logError } from '@/lib/logger';
import { getDb } from '@/db';
import { passwordResetTokens, users } from '@/db/schema';

const resetSchema = z.object({
  token: z.string().min(1).max(512),
  password: z.string().min(8).max(128),
});

function errorRedirect(request: Request, code: 'invalid' | 'used' | 'expired' | 'server', token?: string) {
  const url = new URL('/reset-password', request.url);
  url.searchParams.set('error', code);
  if (token) {
    url.searchParams.set('token', token);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const rawToken = (await request.formData().catch(() => null))?.get('token');

  try {
    const formData = await request.formData();
    const tokenVal = formData.get('token');
    const parsed = resetSchema.safeParse({
      token: tokenVal,
      password: formData.get('password'),
    });

    if (!parsed.success) {
      return errorRedirect(
        request,
        'invalid',
        typeof tokenVal === 'string' ? tokenVal : undefined,
      );
    }

    const db = getDb();
    const tokenHash = hashToken(parsed.data.token);
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);

    if (!row) {
      return errorRedirect(request, 'invalid', parsed.data.token);
    }

    if (row.usedAt) {
      return errorRedirect(request, 'used', parsed.data.token);
    }

    if (row.expiresAt.getTime() <= Date.now()) {
      return errorRedirect(request, 'expired', parsed.data.token);
    }

    const now = new Date();
    const newHash = await hashPassword(parsed.data.password);

    await db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash: newHash }).where(eq(users.id, row.userId));
      await tx.update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, row.id));
    });

    return NextResponse.redirect(new URL('/login?reset=success', request.url), 303);
  } catch (err) {
    logError('reset_error', err);
    return errorRedirect(
      request,
      'server',
      typeof rawToken === 'string' ? rawToken : undefined,
    );
  }
}

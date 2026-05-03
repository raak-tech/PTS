import { desc, eq } from 'drizzle-orm';

import { getDb } from '../../src/db/index';
import { emailOutbox, passwordResetTokens } from '../../src/db/schema';
import { hashToken } from '../../src/lib/auth';

export function getLatestOutboxBodyForEmail(toEmail: string) {
  const db = getDb();
  const row = db
    .select()
    .from(emailOutbox)
    .where(eq(emailOutbox.toEmail, toEmail))
    .orderBy(desc(emailOutbox.createdAt))
    .limit(1)
    .get();
  return row?.bodyText ?? null;
}

export function extractTokenFromOutboxBody(body: string): string | null {
  const m = body.match(/[?&]token=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

export function expirePasswordResetTokenByPlaintext(plainToken: string) {
  const db = getDb();
  const tokenHash = hashToken(plainToken);
  const past = new Date(0);
  db.update(passwordResetTokens)
    .set({ expiresAt: past })
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .run();
}

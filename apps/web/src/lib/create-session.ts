import { randomUUID } from 'node:crypto';

import { getDb } from '@/db';
import { sessions } from '@/db/schema';
import { createSessionToken, hashToken, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';

export async function createUserSession(userId: string) {
  const now = new Date();
  const sessionToken = createSessionToken();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

  await getDb().insert(sessions).values({
    id: randomUUID(),
    userId,
    tokenHash: hashToken(sessionToken),
    createdAt: now,
    expiresAt,
  });

  return { token: sessionToken, expiresAt };
}

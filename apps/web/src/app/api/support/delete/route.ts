import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '../../../../db';
import { passwordResetTokens, sessions, supportArtifacts, userConsents, users } from '../../../../db/schema';
import { logError } from '../../../../lib/logger';
import { clearSessionCookie } from '../../../../lib/cookies';
import { getUserFromRequest } from '../../../../lib/session';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const db = getDb();

    await db.transaction(async (tx: typeof db) => {
      await tx.delete(supportArtifacts).where(eq(supportArtifacts.userId, user.id));
      await tx.delete(userConsents).where(eq(userConsents.userId, user.id));
      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
      await tx.delete(sessions).where(eq(sessions.userId, user.id));
      await tx.delete(users).where(eq(users.id, user.id));
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(clearSessionCookie());
    return response;
  } catch (err) {
    logError('delete_account_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

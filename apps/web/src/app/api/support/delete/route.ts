import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '../../../../db';
import { supportArtifacts, userConsents } from '../../../../db/schema';
import { getUserFromCookieHeader } from '../../../../lib/session';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function POST(request: Request) {
  const user = await getUserFromCookieHeader(request.headers.get('cookie'));
  if (!user) return unauthorized();

  const db = getDb();
  await db.delete(supportArtifacts).where(eq(supportArtifacts.userId, user.id));
  await db
    .insert(userConsents)
    .values({
      userId: user.id,
      dataStorageEnabled: false,
      enabledAt: null,
      revokedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userConsents.userId,
      set: {
        dataStorageEnabled: false,
        enabledAt: null,
        revokedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}

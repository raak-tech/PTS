import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '../../../../db';
import { supportArtifacts, userConsents } from '../../../../db/schema';
import { getUserFromCookieHeader } from '../../../../lib/session';
import { recordSupportAuditEvent } from '../../../../lib/support-audit';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function POST(request: Request) {
  const user = await getUserFromCookieHeader(request.headers.get('cookie'));
  if (!user) return unauthorized();

  const db = getDb();
  await recordSupportAuditEvent(db, user.id, 'delete-requested', 'User deleted all stored support data');
  await db.delete(supportArtifacts).where(eq(supportArtifacts.userId, user.id));
  await db
    .insert(userConsents)
    .values({
      userId: user.id,
      providerAccessEnabled: false,
      reflectionsEnabled: false,
      redFlagsStorageEnabled: false,
      enabledAt: null,
      revokedAt: new Date(),
      reflectionEncryptionEnabled: false,
      reflectionSalt: null,
    })
    .onConflictDoUpdate({
      target: userConsents.userId,
      set: {
        providerAccessEnabled: false,
        reflectionsEnabled: false,
        redFlagsStorageEnabled: false,
        enabledAt: null,
        revokedAt: new Date(),
        reflectionEncryptionEnabled: false,
        reflectionSalt: null,
      },
    });

  return NextResponse.json({ ok: true });
}

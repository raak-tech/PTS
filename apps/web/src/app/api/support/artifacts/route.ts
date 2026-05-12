import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '../../../../db';
import { supportArtifacts, userConsents } from '../../../../db/schema';
import { getUserFromCookieHeader } from '../../../../lib/session';
import { recordSupportAuditEvent } from '../../../../lib/support-audit';

const artifactSchema = z.object({
  kind: z.enum(['intake', 'plan', 'daily', 'check-in', 'red-flags']),
  title: z.string().trim().min(1).max(120),
  bodyText: z.string().trim().min(1).max(5000),
  reflectionCiphertext: z.string().trim().min(1).max(12000).optional(),
  reflectionEncryptionMeta: z.string().trim().min(1).max(12000).optional(),
});

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function POST(request: Request) {
  const user = await getUserFromCookieHeader(request.headers.get('cookie'));
  if (!user) return unauthorized();

  const parsed = artifactSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const db = getDb();
  const [consent] = await db.select().from(userConsents).where(eq(userConsents.userId, user.id)).limit(1);

  const requiresProviderAccess = parsed.data.kind === 'intake' || parsed.data.kind === 'plan' || parsed.data.kind === 'check-in';
  const hasEncryptedReflection = Boolean(parsed.data.reflectionCiphertext && parsed.data.reflectionEncryptionMeta);
  const requiresReflections = parsed.data.kind === 'daily' && Boolean(parsed.data.reflectionCiphertext) && !hasEncryptedReflection;
  const requiresRedFlags = parsed.data.kind === 'red-flags';

  if (requiresProviderAccess && !consent?.providerAccessEnabled) {
    return NextResponse.json({ error: 'provider-consent-required' }, { status: 403 });
  }

  if (requiresReflections && !consent?.reflectionsEnabled) {
    return NextResponse.json({ error: 'reflection-consent-required' }, { status: 403 });
  }

  if (requiresRedFlags && !consent?.redFlagsStorageEnabled) {
    return NextResponse.json({ error: 'red-flags-consent-required' }, { status: 403 });
  }

  const now = new Date();
  await db
    .insert(supportArtifacts)
    .values({
      id: randomUUID(),
      userId: user.id,
      kind: parsed.data.kind,
      title: parsed.data.title,
      bodyText: parsed.data.bodyText,
      reflectionCiphertext: parsed.data.reflectionCiphertext ?? null,
      reflectionEncryptionMeta: parsed.data.reflectionEncryptionMeta ?? null,
      createdAt: now,
    });

  await recordSupportAuditEvent(
    db,
    user.id,
    'artifact-saved',
    `${parsed.data.kind} artifact saved: ${parsed.data.title}`
  );

  return NextResponse.json({ ok: true });
}

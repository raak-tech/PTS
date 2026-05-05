import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '../../../../db';
import { supportArtifacts, userConsents } from '../../../../db/schema';
import { getUserFromCookieHeader } from '../../../../lib/session';

const artifactSchema = z.object({
  kind: z.enum(['intake', 'plan', 'daily', 'check-in']),
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
  const consent = db
    .select()
    .from(userConsents)
    .where(eq(userConsents.userId, user.id))
    .get();

  if (!consent?.dataStorageEnabled) {
    return NextResponse.json({ error: 'consent-required' }, { status: 403 });
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
    })
    .run();

  return NextResponse.json({ ok: true });
}

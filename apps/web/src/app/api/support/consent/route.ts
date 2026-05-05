import { randomBytes } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '../../../../db';
import { userConsents } from '../../../../db/schema';
import { getUserFromCookieHeader } from '../../../../lib/session';

const consentSchema = z.object({
  enabled: z.boolean().optional(),
  reflectionEncryptionEnabled: z.boolean().optional(),
});

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

function emptyConsent() {
  return {
    dataStorageEnabled: false,
    reflectionEncryptionEnabled: false,
    reflectionSalt: null as string | null,
  };
}

export async function GET(request: Request) {
  const user = await getUserFromCookieHeader(request.headers.get('cookie'));
  if (!user) return unauthorized();

  const db = getDb();
  const consent = db.select().from(userConsents).where(eq(userConsents.userId, user.id)).get();

  return NextResponse.json({
    ok: true,
    ...emptyConsent(),
    ...(consent
      ? {
          dataStorageEnabled: Boolean(consent.dataStorageEnabled),
          reflectionEncryptionEnabled: Boolean(consent.reflectionEncryptionEnabled),
          reflectionSalt: consent.reflectionSalt,
        }
      : {}),
  });
}

export async function POST(request: Request) {
  const user = await getUserFromCookieHeader(request.headers.get('cookie'));
  if (!user) return unauthorized();

  const parsed = consentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const now = new Date();
  const db = getDb();
  const current = db.select().from(userConsents).where(eq(userConsents.userId, user.id)).get();
  const nextStorageEnabled = parsed.data.enabled ?? current?.dataStorageEnabled ?? false;
  const reflectionEncryptionEnabled = parsed.data.reflectionEncryptionEnabled ?? current?.reflectionEncryptionEnabled ?? false;
  const reflectionSalt =
    reflectionEncryptionEnabled && !current?.reflectionSalt
      ? randomBytes(16).toString('base64')
      : current?.reflectionSalt ?? null;

  await db
    .insert(userConsents)
    .values({
      userId: user.id,
      dataStorageEnabled: nextStorageEnabled,
      enabledAt: nextStorageEnabled ? now : null,
      revokedAt: nextStorageEnabled ? null : now,
      reflectionEncryptionEnabled,
      reflectionSalt,
    })
    .onConflictDoUpdate({
      target: userConsents.userId,
      set: {
        dataStorageEnabled: nextStorageEnabled,
        enabledAt: nextStorageEnabled ? now : null,
        revokedAt: nextStorageEnabled ? null : now,
        reflectionEncryptionEnabled,
        reflectionSalt,
      },
    })
    .run();

  return NextResponse.json({
    ok: true,
    enabled: nextStorageEnabled,
    reflectionEncryptionEnabled,
    reflectionSalt,
  });
}

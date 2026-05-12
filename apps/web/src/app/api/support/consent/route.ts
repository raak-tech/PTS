import { randomBytes } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '../../../../db';
import { userConsents } from '../../../../db/schema';
import { getUserFromCookieHeader } from '../../../../lib/session';
import { recordSupportAuditEvent } from '../../../../lib/support-audit';

const consentSchema = z.object({
  providerAccessEnabled: z.boolean().optional(),
  reflectionsEnabled: z.boolean().optional(),
  redFlagsStorageEnabled: z.boolean().optional(),
  reflectionEncryptionEnabled: z.boolean().optional(),
});

function emptyConsent() {
  return {
    providerAccessEnabled: false,
    reflectionsEnabled: false,
    redFlagsStorageEnabled: false,
    reflectionEncryptionEnabled: false,
    reflectionSalt: null as string | null,
  };
}

export async function GET(request: Request) {
  const user = await getUserFromCookieHeader(request.headers.get('cookie'));
  if (!user) {
    return NextResponse.json({ ok: true, ...emptyConsent() });
  }

  const db = getDb();
  const [consent] = await db.select().from(userConsents).where(eq(userConsents.userId, user.id)).limit(1);

  return NextResponse.json({
    ok: true,
    ...emptyConsent(),
    ...(consent
      ? {
          providerAccessEnabled: Boolean(consent.providerAccessEnabled),
          reflectionsEnabled: Boolean(consent.reflectionsEnabled),
          redFlagsStorageEnabled: Boolean(consent.redFlagsStorageEnabled),
          reflectionEncryptionEnabled: Boolean(consent.reflectionEncryptionEnabled),
          reflectionSalt: consent.reflectionSalt,
        }
      : {}),
  });
}

export async function POST(request: Request) {
  const user = await getUserFromCookieHeader(request.headers.get('cookie'));
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = consentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const db = getDb();
  const [current] = await db.select().from(userConsents).where(eq(userConsents.userId, user.id)).limit(1);

  const nextProviderAccessEnabled = parsed.data.providerAccessEnabled ?? current?.providerAccessEnabled ?? false;
  const nextReflectionsEnabled = parsed.data.reflectionsEnabled ?? current?.reflectionsEnabled ?? false;
  const nextRedFlagsStorageEnabled = parsed.data.redFlagsStorageEnabled ?? current?.redFlagsStorageEnabled ?? false;
  const reflectionEncryptionEnabled =
    parsed.data.reflectionEncryptionEnabled ?? current?.reflectionEncryptionEnabled ?? false;
  const reflectionSalt =
    reflectionEncryptionEnabled && !current?.reflectionSalt
      ? randomBytes(16).toString('base64')
      : current?.reflectionSalt ?? null;
  const anyEnabled = nextProviderAccessEnabled || nextReflectionsEnabled || nextRedFlagsStorageEnabled;
  const now = new Date();

  await db
    .insert(userConsents)
    .values({
      userId: user.id,
      providerAccessEnabled: nextProviderAccessEnabled,
      reflectionsEnabled: nextReflectionsEnabled,
      redFlagsStorageEnabled: nextRedFlagsStorageEnabled,
      enabledAt: anyEnabled ? now : null,
      revokedAt: anyEnabled ? null : now,
      reflectionEncryptionEnabled,
      reflectionSalt,
    })
    .onConflictDoUpdate({
      target: userConsents.userId,
      set: {
        providerAccessEnabled: nextProviderAccessEnabled,
        reflectionsEnabled: nextReflectionsEnabled,
        redFlagsStorageEnabled: nextRedFlagsStorageEnabled,
        enabledAt: anyEnabled ? now : null,
        revokedAt: anyEnabled ? null : now,
        reflectionEncryptionEnabled,
        reflectionSalt,
      },
    });

  await recordSupportAuditEvent(
    db,
    user.id,
    'consent-updated',
    `provider access ${nextProviderAccessEnabled ? 'enabled' : 'disabled'}, reflections ${nextReflectionsEnabled ? 'enabled' : 'disabled'}, red-flags storage ${nextRedFlagsStorageEnabled ? 'enabled' : 'disabled'}`
  );

  return NextResponse.json({
    ok: true,
    providerAccessEnabled: nextProviderAccessEnabled,
    reflectionsEnabled: nextReflectionsEnabled,
    redFlagsStorageEnabled: nextRedFlagsStorageEnabled,
    reflectionEncryptionEnabled,
    reflectionSalt,
  });
}

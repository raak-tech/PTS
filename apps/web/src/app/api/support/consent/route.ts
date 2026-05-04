import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '../../../../db';
import { userConsents } from '../../../../db/schema';
import { getUserFromCookieHeader } from '../../../../lib/session';

const consentSchema = z.object({
  enabled: z.boolean(),
});

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
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

  await db
    .insert(userConsents)
    .values({
      userId: user.id,
      dataStorageEnabled: parsed.data.enabled,
      enabledAt: parsed.data.enabled ? now : null,
      revokedAt: parsed.data.enabled ? null : now,
    })
    .onConflictDoUpdate({
      target: userConsents.userId,
      set: {
        dataStorageEnabled: parsed.data.enabled,
        enabledAt: parsed.data.enabled ? now : null,
        revokedAt: parsed.data.enabled ? null : now,
      },
    })
    .run();

  return NextResponse.json({ ok: true, enabled: parsed.data.enabled });
}

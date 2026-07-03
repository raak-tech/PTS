import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb } from '@/db';
import { counselorProfiles } from '@/db/schema';
import { getUserFromCookieHeader } from '@/lib/session';
import { recordAudit } from '@/lib/audit';
import { logError } from '@/lib/logger';

const schema = z.object({
  fullName: z.string().min(1),
  title: z.string().min(1),
  credentials: z.string().optional(),
  bio: z.string().min(1),
  calendlyUrl: z.union([z.string().url(), z.literal('')]).optional(),
  specialisations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const user = await getUserFromCookieHeader(headersList.get('cookie'));

    if (!user || user.role !== 'provider') {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ ok: false, error: 'invalid input' }, { status: 400 });
    }

    const db = getDb();

    await db
      .update(counselorProfiles)
      .set({
        fullName: parsed.data.fullName,
        title: parsed.data.title,
        credentials: parsed.data.credentials ?? null,
        bio: parsed.data.bio,
        calendlyUrl: parsed.data.calendlyUrl?.trim() || null,
        specialisations: parsed.data.specialisations ? JSON.stringify(parsed.data.specialisations) : JSON.stringify([]),
        languages: parsed.data.languages ? JSON.stringify(parsed.data.languages) : JSON.stringify([]),
      })
      .where(eq(counselorProfiles.userId, user.id));

    void recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'update_profile',
      targetType: 'counselor_profile',
      targetId: user.id,
    });

    return Response.json({ ok: true });
  } catch (err) {
    logError('provider_profile_patch_error', err);
    return Response.json({ ok: false, error: 'internal error' }, { status: 500 });
  }
}

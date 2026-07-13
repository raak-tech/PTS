import { headers } from 'next/headers';
import { z } from 'zod';

import { getDb } from '@/db';
import { counselorProfiles } from '@/db/schema';
import { recordAudit } from '@/lib/audit';
import { ensureCounselorProfile } from '@/lib/counselor-profile';
import { logError } from '@/lib/logger';
import { getUserFromCookieHeader } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';

const schema = z.object({
  fullName: z.string().min(1),
  title: z.string().min(1),
  credentials: z.string().optional(),
  bio: z.string(),
  calendlyUrl: z.union([z.string().url(), z.literal('')]).optional(),
  specialisations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const user = await getUserFromCookieHeader(headersList.get('cookie'));

    if (!user || !canAccessProviderConsole(user)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ ok: false, error: 'invalid input' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date();

    await ensureCounselorProfile(user.id, user.displayName);

    await db
      .insert(counselorProfiles)
      .values({
        userId: user.id,
        fullName: parsed.data.fullName,
        title: parsed.data.title,
        credentials: parsed.data.credentials ?? null,
        bio: parsed.data.bio,
        calendlyUrl: parsed.data.calendlyUrl?.trim() || null,
        specialisations: parsed.data.specialisations
          ? JSON.stringify(parsed.data.specialisations)
          : JSON.stringify([]),
        languages: parsed.data.languages ? JSON.stringify(parsed.data.languages) : JSON.stringify([]),
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: counselorProfiles.userId,
        set: {
          fullName: parsed.data.fullName,
          title: parsed.data.title,
          credentials: parsed.data.credentials ?? null,
          bio: parsed.data.bio,
          calendlyUrl: parsed.data.calendlyUrl?.trim() || null,
          specialisations: parsed.data.specialisations
            ? JSON.stringify(parsed.data.specialisations)
            : JSON.stringify([]),
          languages: parsed.data.languages ? JSON.stringify(parsed.data.languages) : JSON.stringify([]),
        },
      });

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

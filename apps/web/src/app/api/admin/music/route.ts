import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { musicSets } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const upsertSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(200),
  purposeTag: z.enum(['morning', 'flare', 'evening', 'reflection', 'activation', 'wind-down']),
  spotifyUri: z.string().trim().url().optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const rows = await db.select().from(musicSets).orderBy(musicSets.createdAt);

    return NextResponse.json({ ok: true, sets: rows });
  } catch (err) {
    logError('admin_music_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const parsed = upsertSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const id = parsed.data.id ?? `music-${randomUUID().slice(0, 8)}`;
    const now = new Date();

    const [existing] = await db.select({ id: musicSets.id }).from(musicSets).where(eq(musicSets.id, id)).limit(1);

    if (existing) {
      await db
        .update(musicSets)
        .set({
          title: parsed.data.title,
          purposeTag: parsed.data.purposeTag,
          spotifyUri: parsed.data.spotifyUri ?? null,
          description: parsed.data.description ?? null,
        })
        .where(eq(musicSets.id, id));
    } else {
      await db.insert(musicSets).values({
        id,
        title: parsed.data.title,
        purposeTag: parsed.data.purposeTag,
        spotifyUri: parsed.data.spotifyUri ?? null,
        description: parsed.data.description ?? null,
        createdAt: now,
      });
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    logError('admin_music_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

import { asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { musicSets } from '@/db/schema';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    const db = getDb();
    const rows = (await db.select().from(musicSets).orderBy(asc(musicSets.purposeTag))) as Array<
      typeof musicSets.$inferSelect
    >;

    return NextResponse.json({
      ok: true,
      sets: rows.map((row) => ({
        id: row.id,
        title: row.title,
        purposeTag: row.purposeTag,
        spotifyUri: row.spotifyUri,
        description: row.description,
      })),
    });
  } catch (err) {
    logError('music_sets_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

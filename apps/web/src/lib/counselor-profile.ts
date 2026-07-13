import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { counselorProfiles } from '@/db/schema';

const DEFAULT_BIO = 'Tell clients about your approach and experience.';

export type CounselorProfileRow = typeof counselorProfiles.$inferSelect;

export async function ensureCounselorProfile(
  userId: string,
  displayName?: string | null,
): Promise<CounselorProfileRow> {
  const db = getDb();

  const [existing] = await db
    .select()
    .from(counselorProfiles)
    .where(eq(counselorProfiles.userId, userId))
    .limit(1);

  if (existing) return existing;

  const now = new Date();
  const fullName = displayName?.trim() || 'Counselor';

  await db
    .insert(counselorProfiles)
    .values({
      userId,
      fullName,
      title: 'Pain recovery counselor',
      credentials: null,
      specialisations: JSON.stringify([]),
      languages: JSON.stringify(['English']),
      bio: DEFAULT_BIO,
      createdAt: now,
    })
    .onConflictDoNothing();

  const [created] = await db
    .select()
    .from(counselorProfiles)
    .where(eq(counselorProfiles.userId, userId))
    .limit(1);

  if (!created) {
    throw new Error('counselor_profile_ensure_failed');
  }

  return created;
}

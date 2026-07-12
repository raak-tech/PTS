import { and, desc, eq, isNull } from 'drizzle-orm';

import { getDb } from '@/db';
import { clientProfile, profileFacts } from '@/db/schema';
import type { ProfileSnapshot } from '@/lib/pain-script/types';

const PROFILE_FIELDS = [
  'lifeRoles',
  'workStatus',
  'returnToWork',
  'livingSituation',
  'culturalFrame',
  'identityBefore',
  'whatMissed',
  'lifeBackVision',
  'coreValues',
  'onsetType',
  'trajectory',
  'diagnosesContext',
  'comorbidities',
  'currentTreatments',
  'whatHelps',
  'whoUnderstands',
  'engagementPrefs',
] as const;

export async function loadProfileSnapshot(userId: string): Promise<ProfileSnapshot> {
  const db = getDb();
  const [profile] = await db
    .select()
    .from(clientProfile)
    .where(eq(clientProfile.userId, userId))
    .limit(1);

  const facts = await db
    .select()
    .from(profileFacts)
    .where(and(eq(profileFacts.userId, userId), eq(profileFacts.counselorHeld, false)));

  const structured: Record<string, string | null> = {};
  let filled = 0;
  for (const key of PROFILE_FIELDS) {
    const val = profile ? (profile[key] as string | null) : null;
    structured[key] = val;
    if (val && val.trim()) filled += 1;
  }

  const completeness = PROFILE_FIELDS.length > 0 ? filled / PROFILE_FIELDS.length : 0;

  return {
    structured,
    facts: facts.map((f) => ({
      key: f.key,
      value: f.value,
      category: f.category,
      source: f.source,
      sensitive: f.sensitive,
      counselorHeld: f.counselorHeld,
    })),
    completeness,
  };
}

export async function seedClientProfileFromIntake(
  userId: string,
  intake: {
    occupation?: string | null;
    recoveryGoal?: string | null;
    biggestChange?: string | null;
    socialSupport?: string | null;
    currentTreatment?: string | null;
    onsetType?: string | null;
  },
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const [existing] = await db
    .select({ userId: clientProfile.userId })
    .from(clientProfile)
    .where(eq(clientProfile.userId, userId))
    .limit(1);

  const values = {
    workStatus: intake.occupation ?? null,
    lifeBackVision: intake.recoveryGoal ?? null,
    whatMissed: intake.biggestChange ?? null,
    whoUnderstands: intake.socialSupport ?? null,
    currentTreatments: intake.currentTreatment ?? null,
    onsetType: intake.onsetType ?? null,
    updatedAt: now,
  };

  if (existing) {
    await db.update(clientProfile).set(values).where(eq(clientProfile.userId, userId));
  } else {
    await db.insert(clientProfile).values({
      userId,
      ...values,
      createdAt: now,
    });
  }
}

export function formatProfileSnapshotForPrompt(snapshot: ProfileSnapshot | null): string {
  if (!snapshot) return 'No profile data yet.';
  const lines = Object.entries(snapshot.structured)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`);
  const factLines = snapshot.facts.map((f) => `- ${f.key}: ${f.value} (${f.source})`);
  return [
    `Completeness: ${(snapshot.completeness * 100).toFixed(0)}%`,
    ...lines,
    ...factLines,
  ].join('\n');
}

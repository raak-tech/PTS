import { desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeSessions } from '@/db/schema';
import type { PainScriptSignals } from '@/lib/confidential/pain-script-framework';
import type { ExtractedIntake } from '@/lib/intake-extractor';

/** Load optional pain-script signals from the latest confirmed/draft intake session extraction. */
export async function loadPainScriptSignalsForUser(userId: string): Promise<PainScriptSignals | null> {
  const db = getDb();
  const [session] = await db
    .select({ extractionJson: intakeSessions.extractionJson })
    .from(intakeSessions)
    .where(eq(intakeSessions.userId, userId))
    .orderBy(desc(intakeSessions.updatedAt))
    .limit(1);

  if (!session?.extractionJson) return null;

  try {
    const parsed = JSON.parse(session.extractionJson) as ExtractedIntake;
    const raw = parsed.painScriptSignals?.value;
    if (!raw) return null;
    if (typeof raw === 'string') {
      return JSON.parse(raw) as PainScriptSignals;
    }
    if (typeof raw === 'object') {
      return raw as PainScriptSignals;
    }
    return null;
  } catch {
    return null;
  }
}

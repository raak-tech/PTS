import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserPilotCohort, assignPilotCohortIfUnset } from '@/lib/pain-script/cohort';
import { defaultCohortFromBuild } from '@/lib/pain-script/flags';
import { getUserFromRequest } from '@/lib/session';
import { logError } from '@/lib/logger';

const postSchema = z.object({
  /** APK B sends pain_script from EXPO_PUBLIC_PILOT_COHORT — never trust arbitrary downgrade. */
  pilotCohort: z.enum(['legacy', 'pain_script']).optional(),
});

/** GET cohort; POST assign pain_script cohort on first mobile login (APK B). */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const cohort = await getUserPilotCohort(user.id);
    return NextResponse.json({ ok: true, pilotCohort: cohort });
  } catch (err) {
    logError('me_cohort_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    let requested = defaultCohortFromBuild();
    try {
      const raw = await request.json();
      const parsed = postSchema.safeParse(raw);
      if (parsed.success && parsed.data.pilotCohort === 'pain_script') {
        requested = 'pain_script';
      }
    } catch {
      /* empty body — build default only */
    }

    const cohort = await assignPilotCohortIfUnset(user.id, requested);
    return NextResponse.json({ ok: true, pilotCohort: cohort });
  } catch (err) {
    logError('me_cohort_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

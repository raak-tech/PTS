import { NextResponse } from 'next/server';

import { getUserPilotCohort, assignPilotCohortIfUnset } from '@/lib/pain-script/cohort';
import { defaultCohortFromBuild } from '@/lib/pain-script/flags';
import { getUserFromRequest } from '@/lib/session';
import { logError } from '@/lib/logger';

/** GET cohort; POST assign build-time cohort on first mobile login (APK B). */
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

    const buildCohort = defaultCohortFromBuild();
    const cohort = await assignPilotCohortIfUnset(user.id, buildCohort);
    return NextResponse.json({ ok: true, pilotCohort: cohort });
  } catch (err) {
    logError('me_cohort_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

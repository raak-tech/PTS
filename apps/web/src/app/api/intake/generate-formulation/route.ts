import { NextResponse } from 'next/server';

import { getUserFromRequest } from '@/lib/session';
import { runFormulationGenerationForUser } from '@/lib/pain-script/on-intake-confirmed';
import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import { logError } from '@/lib/logger';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const cohort = await getUserPilotCohort(user.id);
    if (!usesPainScriptPath(cohort)) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'legacy_cohort' });
    }

    const formulationId = await runFormulationGenerationForUser(user.id);
    return NextResponse.json({ ok: true, formulationId });
  } catch (err) {
    logError('generate_formulation_error', err);
    const message = err instanceof Error ? err.message : 'internal';
    return NextResponse.json({ error: 'internal', detail: message }, { status: 500 });
  }
}

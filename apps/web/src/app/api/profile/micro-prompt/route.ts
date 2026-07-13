import { NextResponse } from 'next/server';

import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import { getClientProfileView } from '@/lib/pain-script/profile-service';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const cohort = await getUserPilotCohort(user.id);
    if (!usesPainScriptPath(cohort)) {
      return NextResponse.json({ error: 'not_available' }, { status: 404 });
    }

    const profile = await getClientProfileView(user.id);
    return NextResponse.json({
      ok: true,
      microPrompt: profile.microPrompt,
      completeness: profile.completeness,
      completenessLabel: profile.completenessLabel,
    });
  } catch (err) {
    logError('profile_micro_prompt_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

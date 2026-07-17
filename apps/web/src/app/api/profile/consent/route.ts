import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import { CONSENT_SCOPES } from '@/lib/pain-script/profile-fields';
import { getClientProfileView, setConsentScope } from '@/lib/pain-script/profile-service';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const postSchema = z.object({
  scope: z.enum(CONSENT_SCOPES),
  granted: z.boolean(),
});

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
    return NextResponse.json({ ok: true, consentGrants: profile.consentGrants });
  } catch (err) {
    logError('profile_consent_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const cohort = await getUserPilotCohort(user.id);
    if (!usesPainScriptPath(cohort)) {
      return NextResponse.json({ error: 'not_available' }, { status: 404 });
    }

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    await setConsentScope(user.id, parsed.data.scope, parsed.data.granted);
    const profile = await getClientProfileView(user.id);
    return NextResponse.json({ ok: true, consentGrants: profile.consentGrants });
  } catch (err) {
    logError('profile_consent_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

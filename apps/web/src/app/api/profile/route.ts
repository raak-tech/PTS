import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import { isProfileFieldKey } from '@/lib/pain-script/profile-fields';
import { getClientProfileView, updateClientProfile } from '@/lib/pain-script/profile-service';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const patchSchema = z.record(z.string(), z.string().max(4000).nullable());

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
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    logError('profile_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const cohort = await getUserPilotCohort(user.id);
    if (!usesPainScriptPath(cohort)) {
      return NextResponse.json({ error: 'not_available' }, { status: 404 });
    }

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const patch: Record<string, string | null> = {};
    for (const [key, val] of Object.entries(parsed.data)) {
      if (isProfileFieldKey(key) && (typeof val === 'string' || val === null)) {
        patch[key] = val;
      }
    }

    const result = await updateClientProfile(user.id, patch);
    if (!result.ok) {
      const status = result.error === 'consent_required' ? 403 : 400;
      return NextResponse.json({ error: result.error, consentScope: result.consentScope }, { status });
    }

    const profile = await getClientProfileView(user.id);
    return NextResponse.json({ ok: true, changedKeys: result.changedKeys, profile });
  } catch (err) {
    logError('profile_patch_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

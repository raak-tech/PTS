import { NextResponse } from 'next/server';
import { z } from 'zod';

import { assertCounselorForClient } from '@/lib/client-access';
import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import { isProfileFieldKey, PROFILE_FIELD_DEFS } from '@/lib/pain-script/profile-fields';
import { createProfileFieldRequest, getClientProfileView } from '@/lib/pain-script/profile-service';
import { canAccessProviderConsole } from '@/lib/provider-console-access';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const postSchema = z.object({
  fieldKey: z.string().min(1).max(64),
  prompt: z.string().min(1).max(1000),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id: clientId } = await params;
    if (!(await assertCounselorForClient(user.id, clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const cohort = await getUserPilotCohort(clientId);
    if (!usesPainScriptPath(cohort)) {
      return NextResponse.json({ error: 'not_available' }, { status: 404 });
    }

    const profile = await getClientProfileView(clientId);
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    logError('provider_profile_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id: clientId } = await params;
    if (!(await assertCounselorForClient(user.id, clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const cohort = await getUserPilotCohort(clientId);
    if (!usesPainScriptPath(cohort)) {
      return NextResponse.json({ error: 'not_available' }, { status: 404 });
    }

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    if (!isProfileFieldKey(parsed.data.fieldKey)) {
      return NextResponse.json({ error: 'unknown_field' }, { status: 400 });
    }

    const def = PROFILE_FIELD_DEFS.find((d) => d.key === parsed.data.fieldKey);
    const id = await createProfileFieldRequest({
      counselorId: user.id,
      clientId,
      fieldKey: parsed.data.fieldKey,
      prompt: parsed.data.prompt || def?.microPrompt || parsed.data.fieldKey,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    logError('provider_profile_field_request_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import { answerFieldRequest, getClientProfileView } from '@/lib/pain-script/profile-service';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const answerSchema = z.object({
  requestId: z.string().uuid(),
  value: z.string().min(1).max(4000),
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
    return NextResponse.json({ ok: true, pendingFieldRequests: profile.pendingFieldRequests });
  } catch (err) {
    logError('profile_field_requests_get_error', err);
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

    const parsed = answerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const result = await answerFieldRequest(user.id, parsed.data.requestId, parsed.data.value);
    if (!result.ok) {
      const status = result.error === 'consent_required' ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    const profile = await getClientProfileView(user.id);
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    logError('profile_field_requests_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

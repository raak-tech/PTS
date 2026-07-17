import { NextResponse } from 'next/server';

import { assertProviderCanAccessClient } from '@/lib/client-access';
import { getApprovedFormulation, getCurrentFormulation, updateFormulationDraft } from '@/lib/pain-script/formulation-store';
import type { PainScriptFormulation } from '@/lib/pain-script/types';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const { userId } = await context.params;
    if (!(await assertProviderCanAccessClient(user.id, userId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const stored = await getCurrentFormulation(userId);
    if (!stored) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    const approved =
      stored.source === 'rescore' ? await getApprovedFormulation(userId) : null;
    return NextResponse.json({ ok: true, formulation: stored, approvedFormulation: approved });
  } catch (err) {
    logError('formulation_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const { userId } = await context.params;
    if (!(await assertProviderCanAccessClient(user.id, userId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const stored = await getCurrentFormulation(userId);
    if (!stored) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    const body = (await request.json()) as Partial<PainScriptFormulation> & {
      counselorNote?: string;
    };
    await updateFormulationDraft(stored.id, body);
    const updated = await getCurrentFormulation(userId);
    return NextResponse.json({ ok: true, formulation: updated });
  } catch (err) {
    logError('formulation_patch_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

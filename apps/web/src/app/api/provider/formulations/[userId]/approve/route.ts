import { NextResponse } from 'next/server';

import { recordAudit } from '@/lib/audit';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { approveFormulation, getCurrentFormulation } from '@/lib/pain-script/formulation-store';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(request: Request, context: RouteContext) {
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
    if (stored.status === 'approved') {
      return NextResponse.json({ ok: true, alreadyApproved: true });
    }

    await approveFormulation(stored.id, user.id);

    void recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'approve_formulation',
      targetType: 'formulation',
      targetId: stored.id,
      metadata: { clientId: userId },
    });

    return NextResponse.json({ ok: true, formulationId: stored.id });
  } catch (err) {
    logError('formulation_approve_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

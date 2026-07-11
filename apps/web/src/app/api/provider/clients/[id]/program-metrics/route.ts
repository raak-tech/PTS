import { NextResponse } from 'next/server';

import { buildProgramMetrics } from '@/lib/client-week-metrics';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';

export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/provider/clients/[id]/program-metrics
// Cross-week engagement patterns for the counselor workspace Plan tab.
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id: clientId } = await context.params;
    if (!(await assertProviderCanAccessClient(user.id, clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const metrics = await buildProgramMetrics(clientId);
    return NextResponse.json({ ok: true, ...metrics });
  } catch (err) {
    logError('provider_program_metrics_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

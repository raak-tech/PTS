import { NextResponse } from 'next/server';

import { buildEngagementForClients } from '@/lib/client-engagement';
import { assertProviderCanAccessClient, getVisibleClientIdsForProvider } from '@/lib/client-access';
import { localDateIso } from '@/lib/daily-layer';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientIdParam = url.searchParams.get('clientId');
    const today = localDateIso();

    let clientIds: string[];

    if (clientIdParam) {
      if (!(await assertProviderCanAccessClient(user.id, clientIdParam))) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      clientIds = [clientIdParam];
    } else {
      clientIds = await getVisibleClientIdsForProvider(user.id);
    }

    const clients = await buildEngagementForClients(clientIds, today);

    const completedToday = clients.filter((c) => c.assignedTaskCount > 0 && c.completionPct >= 100).length;
    const withTasks = clients.filter((c) => c.assignedTaskCount > 0).length;

    return NextResponse.json({
      ok: true,
      date: today,
      clients: clients.sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention)),
      caseload: {
        total: clients.length,
        withTasks,
        completedToday,
        avgCompletionPct:
          withTasks > 0
            ? Math.round(clients.reduce((n, c) => n + c.completionPct, 0) / withTasks)
            : 0,
      },
    });
  } catch (err) {
    logError('provider_engagement_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

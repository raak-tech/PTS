import { NextResponse } from 'next/server';

import { assertProviderCanAccessClient } from '@/lib/client-access';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';
import { buildWeeklySummary } from '@/lib/weekly-summary';

type RouteContext = { params: Promise<{ id: string }> };

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

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart') ?? undefined;
    const summary = await buildWeeklySummary(clientId, weekStart);

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    logError('weekly_summary_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

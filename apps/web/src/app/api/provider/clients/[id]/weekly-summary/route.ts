import { NextResponse } from 'next/server';

import { assertCounselorForClient } from '@/lib/client-access';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';
import { buildWeeklySummary } from '@/lib/weekly-summary';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id: clientId } = await context.params;
    if (!(await assertCounselorForClient(user.id, clientId))) {
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

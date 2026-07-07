import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { plans } from '@/db/schema';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { logError } from '@/lib/logger';
import { toDateIso, weekDateRange } from '@/lib/program-calendar';
import { getUserFromRequest } from '@/lib/session';
import { buildWeeklySummary } from '@/lib/weekly-summary';

type RouteContext = { params: Promise<{ id: string; weekNumber: string }> };

// GET /api/provider/clients/[id]/week/[weekNumber]/activity
// Per-week engagement snapshot for the counselor workspace sub-tab.
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id: clientId, weekNumber } = await context.params;
    const weekNum = Number(weekNumber);
    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > 6) {
      return NextResponse.json({ error: 'invalid_week' }, { status: 400 });
    }

    if (!(await assertProviderCanAccessClient(user.id, clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const db = getDb();
    const [plan] = await db
      .select({ programAnchorDate: plans.programAnchorDate, approvedAt: plans.approvedAt })
      .from(plans)
      .where(eq(plans.userId, clientId))
      .orderBy(desc(plans.createdAt))
      .limit(1);

    const anchor = plan?.programAnchorDate ?? (plan?.approvedAt ? toDateIso(plan.approvedAt) : null);
    if (!anchor) {
      return NextResponse.json({ ok: true, weekNumber: weekNum, anchored: false, summary: null });
    }

    const { start } = weekDateRange(anchor, weekNum);
    const summary = await buildWeeklySummary(clientId, start);

    return NextResponse.json({ ok: true, weekNumber: weekNum, anchored: true, summary });
  } catch (err) {
    logError('provider_week_activity_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

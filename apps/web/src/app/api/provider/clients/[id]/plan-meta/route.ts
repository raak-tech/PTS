import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { planWeeks, plans, supportArtifacts, userConsents } from '@/db/schema';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(_request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id: clientId } = await context.params;
    if (!(await assertProviderCanAccessClient(user.id, clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const db = getDb();

    const [latestPlan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.userId, clientId))
      .orderBy(desc(plans.createdAt))
      .limit(1);

    type WeekRow = { weekNumber: number; status: string };
    const weekStatusRows: WeekRow[] = latestPlan
      ? ((await db
          .select({ weekNumber: planWeeks.weekNumber, status: planWeeks.status })
          .from(planWeeks)
          .where(eq(planWeeks.planId, latestPlan.id))) as WeekRow[])
      : [];

    const weekStatuses = Object.fromEntries(
      weekStatusRows.map((r) => [r.weekNumber, r.status as 'draft' | 'edited' | 'approved']),
    );

    const [consent] = await db
      .select({ dataStorageEnabled: userConsents.dataStorageEnabled })
      .from(userConsents)
      .where(eq(userConsents.userId, clientId))
      .limit(1);

    type ShareRow = { id: string; title: string; bodyText: string; createdAt: Date };
    const shareRows: ShareRow[] =
      consent?.dataStorageEnabled
        ? ((await db
            .select({
              id: supportArtifacts.id,
              title: supportArtifacts.title,
              bodyText: supportArtifacts.bodyText,
              createdAt: supportArtifacts.createdAt,
            })
            .from(supportArtifacts)
            .where(
              and(eq(supportArtifacts.userId, clientId), eq(supportArtifacts.kind, 'counselor-share')),
            )
            .orderBy(desc(supportArtifacts.createdAt))
            .limit(20)) as ShareRow[])
        : [];

    return NextResponse.json({
      ok: true,
      planId: latestPlan?.id ?? null,
      weekStatuses,
      clientUpdates: shareRows.map((a) => ({
        id: a.id,
        title: a.title,
        bodyText: a.bodyText,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    logError('provider_client_plan_meta_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

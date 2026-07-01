import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { clientCounselor, users } from '@/db/schema';
import { buildEngagementForClients } from '@/lib/client-engagement';
import { localDateIso } from '@/lib/daily-layer';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientIdParam = url.searchParams.get('clientId');
    const today = localDateIso();
    const db = getDb();

    let clientIds: string[];

    if (clientIdParam) {
      clientIds = [clientIdParam];
    } else {
      const assigned = (await db
        .select({ clientId: clientCounselor.clientId })
        .from(clientCounselor)
        .where(eq(clientCounselor.counselorId, user.id))) as { clientId: string }[];

      const assignedIds = assigned.map((a) => a.clientId);

      // Pilot: also include all registered clients so the counselor console is not empty.
      const allClients = (await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'client'))
        .orderBy(desc(users.createdAt))) as { id: string }[];

      const merged = new Set<string>([...assignedIds, ...allClients.map((c) => c.id)]);
      clientIds = [...merged];
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

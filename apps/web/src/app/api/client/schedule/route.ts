import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { clientCounselor } from '@/db/schema';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'client') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const [row] = await db
    .select({
      scheduleRequired: clientCounselor.scheduleRequired,
      scheduleCompletedAt: clientCounselor.scheduleCompletedAt,
    })
    .from(clientCounselor)
    .where(eq(clientCounselor.clientId, user.id))
    .limit(1);

  return NextResponse.json({
    ok: true,
    scheduleRequired: row?.scheduleRequired ?? false,
    scheduleCompletedAt: row?.scheduleCompletedAt?.toISOString() ?? null,
  });
}

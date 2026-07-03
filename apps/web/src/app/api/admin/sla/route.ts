import { NextResponse } from 'next/server';

import { isAdminUser } from '@/lib/admin';
import { collectSlaBreaches } from '@/lib/admin-sla';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const breaches = await collectSlaBreaches();
    return NextResponse.json({ ok: true, breaches, count: breaches.length });
  } catch (err) {
    logError('admin_sla_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

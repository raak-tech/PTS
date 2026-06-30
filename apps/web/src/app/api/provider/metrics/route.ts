import { NextResponse } from 'next/server';

import { isAdminUser } from '@/lib/admin';
import { logError } from '@/lib/logger';
import { collectPlatformMetrics } from '@/lib/metrics';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    return NextResponse.json(await collectPlatformMetrics());
  } catch (err) {
    logError('metrics_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

import { logError } from '@/lib/logger';
import { collectPlatformMetrics } from '@/lib/metrics';
import { getUserFromRequest } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    return NextResponse.json(await collectPlatformMetrics());
  } catch (err) {
    logError('metrics_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

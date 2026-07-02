import { NextResponse } from 'next/server';

import { isAdminUser } from '@/lib/admin';
import { collectAdminAnalytics, parseAnalyticsRange } from '@/lib/admin-analytics';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = parseAnalyticsRange(searchParams.get('days'));
    return NextResponse.json(await collectAdminAnalytics(range));
  } catch (err) {
    logError('admin_analytics_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

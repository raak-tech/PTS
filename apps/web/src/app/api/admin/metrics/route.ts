import { NextResponse } from 'next/server';

import { isAdminUser } from '@/lib/admin';
import { getMetricDetail, isMetricDetailKind } from '@/lib/admin-metric-details';
import { logError } from '@/lib/logger';
import { collectPlatformMetrics } from '@/lib/metrics';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail');
    if (detail) {
      if (!isMetricDetailKind(detail)) {
        return NextResponse.json({ error: 'invalid_detail' }, { status: 400 });
      }
      return NextResponse.json(await getMetricDetail(detail));
    }

    return NextResponse.json(await collectPlatformMetrics());
  } catch (err) {
    logError('admin_metrics_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

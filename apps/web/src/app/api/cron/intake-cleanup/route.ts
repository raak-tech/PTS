import { lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { intakeResponses } from '@/db/schema';
import { log, logError } from '@/lib/logger';

function assertCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/** DELETE intake responses older than 90 days (DECISIONS.md retention). */
export async function GET(request: Request) {
  if (!assertCronAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const deleted = await db
      .delete(intakeResponses)
      .where(lt(intakeResponses.createdAt, cutoff))
      .returning({ id: intakeResponses.id });

    log('intake_cleanup_cron', { deleted: deleted.length, cutoff: cutoff.toISOString() });
    return NextResponse.json({ ok: true, deleted: deleted.length });
  } catch (err) {
    logError('intake_cleanup_cron_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

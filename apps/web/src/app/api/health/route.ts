import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { log, logError } from '@/lib/logger';

export async function GET() {
  const start = Date.now();

  try {
    // Lightweight connectivity check via a real Drizzle query.
    const db = getDb();
    await db.select({ one: sql<number>`1` }).from(sql`(select 1) as t`).limit(1);

    const ms = Date.now() - start;
    log('health_check', { status: 'ok', db_ms: ms });
    return NextResponse.json({ status: 'ok', db_ms: ms });
  } catch (err) {
    logError('health_check_failed', err);
    return NextResponse.json({ status: 'error', detail: 'db_unreachable' }, { status: 503 });
  }
}

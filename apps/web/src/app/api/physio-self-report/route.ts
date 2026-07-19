import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { physioSelfReports } from '@/db/schema';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const submitSchema = z.object({
  status: z.enum(['yes', 'partly', 'no']),
  date: z.string().regex(DATE_RE).optional(),
});

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Patient self-reported physio-exercise completion for a day. This is a SEPARATE
 * signal from PTS program engagement and is always patient self-report.
 */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const dateIso = dateParam && DATE_RE.test(dateParam) ? dateParam : todayIso();

    const db = getDb();
    const [row] = await db
      .select({ status: physioSelfReports.status, submittedAt: physioSelfReports.submittedAt })
      .from(physioSelfReports)
      .where(and(eq(physioSelfReports.clientId, user.id), eq(physioSelfReports.dateIso, dateIso)))
      .limit(1);

    return NextResponse.json({
      ok: true,
      date: dateIso,
      report: row ? { status: row.status, submittedAt: row.submittedAt.toISOString() } : null,
    });
  } catch (err) {
    logError('physio_self_report_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (user.role !== 'client') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const parsed = submitSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

    const dateIso = parsed.data.date ?? todayIso();
    const db = getDb();
    const now = new Date();
    await db
      .insert(physioSelfReports)
      .values({
        id: randomUUID(),
        clientId: user.id,
        dateIso,
        status: parsed.data.status,
        submittedAt: now,
      })
      .onConflictDoUpdate({
        target: [physioSelfReports.clientId, physioSelfReports.dateIso],
        set: { status: parsed.data.status, submittedAt: now },
      });

    return NextResponse.json({ ok: true, date: dateIso, status: parsed.data.status });
  } catch (err) {
    logError('physio_self_report_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

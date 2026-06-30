import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { getUserFromRequest } from '../../../../lib/session';

// Define monthly_check_ins table schema inline (or reuse if already in schema.ts)
const monthlyCheckIns = pgTable('monthly_check_ins', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull(),
  yearMonth: text('year_month').notNull(), // YYYY-MM format
  painLevel: integer('pain_level').notNull(),
  sleepQuality: text('sleep_quality').notNull(),
  intention: text('intention'),
  submittedAt: timestamp('submitted_at', { mode: 'date', withTimezone: true }).notNull(),
});

function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(monthlyCheckIns)
    .where(eq(monthlyCheckIns.clientId, user.id))
    .orderBy(desc(monthlyCheckIns.yearMonth))
    .limit(1);
  const latest = rows[0] ?? null;

  return NextResponse.json({
    ok: true,
    checkIn: latest? {
      yearMonth: latest.yearMonth,
      painLevel: latest.painLevel,
      sleepQuality: latest.sleepQuality,
      intention: latest.intention,
      submittedAt: latest.submittedAt.toISOString(),
    } : null,
  });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json() as {
    painLevel: number;
    sleepQuality: string;
    intention: string;
  };

  if (
    typeof body.painLevel !== 'number' ||
    body.painLevel < 0 ||
    body.painLevel > 10 ||
    !['poor', 'ok', 'good'].includes(body.sleepQuality)
  ) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const yearMonth = getCurrentYearMonth();
  const db = getDb();

  // Check if already exists for this month
  const existingRows = await db
    .select()
    .from(monthlyCheckIns)
    .where(and(
      eq(monthlyCheckIns.clientId, user.id),
      eq(monthlyCheckIns.yearMonth, yearMonth)
    ));
  const existing = existingRows[0];

  if (existing) {
    // Update
    await db
      .update(monthlyCheckIns)
      .set({
        painLevel: body.painLevel,
        sleepQuality: body.sleepQuality,
        intention: body.intention || '',
        submittedAt: new Date(),
      })
      .where(eq(monthlyCheckIns.id, existing.id));
  } else {
    // Insert
    await db.insert(monthlyCheckIns).values({
      id: `mci_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      clientId: user.id,
      yearMonth: yearMonth,
      painLevel: body.painLevel,
      sleepQuality: body.sleepQuality,
      intention: body.intention || '',
      submittedAt: new Date(),
    });
  }

  return NextResponse.json({ ok: true });
}

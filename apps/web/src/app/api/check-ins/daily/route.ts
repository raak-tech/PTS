import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { dailyCheckIns } from '../../../../db/schema';
import { getUserFromRequest } from '../../../../lib/session';

function localDateIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const dateParam = request.nextUrl.searchParams.get('date');
  const targetDate = dateParam || localDateIso();

  const db = getDb();
  const rows = await db
    .select()
    .from(dailyCheckIns)
    .where(and(
      eq(dailyCheckIns.clientId, user.id),
      eq(dailyCheckIns.dateIso, targetDate)
    ));
  const row = rows[0];

  return NextResponse.json({
    ok: true,
    checkIn: row ? {
      painLevel: row.painLevel,
      sleepQuality: row.sleepQuality,
      intention: row.intention,
      submittedAt: row.submittedAt.toISOString(),
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
    date?: string;
  };

  if (
    typeof body.painLevel !== 'number' ||
    body.painLevel < 0 ||
    body.painLevel > 10 ||
    !['poor', 'ok', 'good'].includes(body.sleepQuality)
  ) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const targetDate = body.date || localDateIso();
  const db = getDb();

  // Upsert: if exists, update; otherwise insert
  const existingRows = await db
    .select()
    .from(dailyCheckIns)
    .where(and(
      eq(dailyCheckIns.clientId, user.id),
      eq(dailyCheckIns.dateIso, targetDate)
    ));
  const existing = existingRows[0];

  if (existing) {
    await db
      .update(dailyCheckIns)
      .set({
        painLevel: body.painLevel,
        sleepQuality: body.sleepQuality,
        intention: body.intention || '',
        submittedAt: new Date(),
      })
      .where(eq(dailyCheckIns.id, existing.id));
  } else {
    await db.insert(dailyCheckIns).values({
      id: `ci_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      clientId: user.id,
      dateIso: targetDate,
      painLevel: body.painLevel,
      sleepQuality: body.sleepQuality,
      intention: body.intention || '',
      submittedAt: new Date(),
    });
  }

  return NextResponse.json({ ok: true });
}

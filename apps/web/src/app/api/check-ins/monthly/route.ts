import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { getDb } from '@/db';
import { monthlyCheckIns } from '@/db/schema';
import { getUserFromRequest } from '@/lib/session';

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
    checkIn: latest
      ? {
          yearMonth: latest.yearMonth,
          painLevel: latest.painLevel,
          sleepQuality: latest.sleepQuality,
          intention: latest.intention,
          submittedAt: latest.submittedAt.toISOString(),
        }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = (await request.json()) as {
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

  const existingRows = await db
    .select()
    .from(monthlyCheckIns)
    .where(and(eq(monthlyCheckIns.clientId, user.id), eq(monthlyCheckIns.yearMonth, yearMonth)));
  const existing = existingRows[0];

  if (existing) {
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
    await db.insert(monthlyCheckIns).values({
      id: randomUUID(),
      clientId: user.id,
      yearMonth,
      painLevel: body.painLevel,
      sleepQuality: body.sleepQuality,
      intention: body.intention || '',
      submittedAt: new Date(),
    });
  }

  return NextResponse.json({ ok: true });
}

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { isValidIndianMobile, normalizePhone } from '@/lib/phone';

const schema = z.object({
  phone: z.string().min(8).max(20),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid-phone' }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!isValidIndianMobile(phone)) {
    return NextResponse.json({ error: 'invalid-phone' }, { status: 400 });
  }

  const db = getDb();
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.phone, phone)).limit(1);

  return NextResponse.json({
    exists: Boolean(user),
    role: user?.role ?? null,
  });
}

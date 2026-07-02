import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { counselorProfiles, users } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { recordAudit } from '@/lib/audit';
import { logError } from '@/lib/logger';
import { isValidIndianMobile, normalizePhone, phoneToEmail } from '@/lib/phone';
import { getUserFromRequest } from '@/lib/session';

function optionalField(min: number, max: number) {
  return z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().trim().min(min).max(max).optional(),
  );
}

const schema = z.object({
  phone: z.string().min(8).max(20),
  role: z.enum(['client', 'provider']),
  displayName: z.string().trim().min(2).max(120),
  title: optionalField(2, 120),
  bio: optionalField(10, 1500),
});

export async function POST(request: Request) {
  try {
    const admin = await getUserFromRequest(request);
    if (!isAdminUser(admin)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid', detail: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!isValidIndianMobile(phone)) {
      return NextResponse.json({ error: 'invalid-phone' }, { status: 400 });
    }

    const db = getDb();
    const [existingPhone] = await db
      .select({ id: users.id, role: users.role, displayName: users.displayName, phone: users.phone })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    if (existingPhone) {
      return NextResponse.json(
        {
          error: 'duplicate-phone',
          existing: {
            role: existingPhone.role,
            displayName: existingPhone.displayName,
            phone: existingPhone.phone,
          },
        },
        { status: 409 },
      );
    }

    const email = phoneToEmail(phone);
    const [existingEmail] = await db
      .select({ id: users.id, role: users.role, displayName: users.displayName, phone: users.phone })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingEmail) {
      return NextResponse.json(
        {
          error: 'duplicate-phone',
          existing: {
            role: existingEmail.role,
            displayName: existingEmail.displayName,
            phone: existingEmail.phone,
          },
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const userId = randomUUID();
    const role = parsed.data.role === 'provider' ? 'provider' : 'client';
    const counselorBio =
      parsed.data.bio && parsed.data.bio.length >= 10
        ? parsed.data.bio
        : 'Counselor profile pending update.';

    await db.insert(users).values({
      id: userId,
      email,
      phone,
      passwordHash: null,
      role,
      displayName: parsed.data.displayName,
      createdAt: now,
    });

    if (role === 'provider') {
      await db.insert(counselorProfiles).values({
        userId,
        fullName: parsed.data.displayName,
        title: parsed.data.title ?? 'Counselor',
        credentials: null,
        specialisations: JSON.stringify(['general']),
        languages: JSON.stringify(['English']),
        yearsExperience: '0',
        bio: counselorBio,
        calendlyUrl: null,
        verifiedAt: now,
        createdAt: now,
      });
    }

    void recordAudit({
      actorUserId: admin!.id,
      actorRole: admin!.role,
      action: 'create_user',
      targetType: 'user',
      targetId: userId,
      metadata: { role, phone: `***${phone.slice(-4)}` },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        phone,
        role,
        displayName: parsed.data.displayName,
      },
    });
  } catch (err) {
    logError('admin_create_user_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

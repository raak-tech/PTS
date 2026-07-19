import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { clinicMemberships, clinics, users } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { hashPassword } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type RouteContext = { params: Promise<{ clinicId: string }> };

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  displayName: z.string().trim().min(2).max(120),
  role: z.enum(['referrer', 'clinic_admin']),
  password: z.string().min(8).max(128).optional(),
});

/**
 * Add a clinic staff member (admin only). Creates a new web-login `referrer`
 * user when the email is new, or attaches an existing referrer/admin user.
 * Clients are never converted into staff.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await getUserFromRequest(request);
    if (!isAdminUser(admin)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { clinicId } = await context.params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

    const db = getDb();
    const [clinic] = await db.select({ id: clinics.id }).from(clinics).where(eq(clinics.id, clinicId)).limit(1);
    if (!clinic) return NextResponse.json({ error: 'clinic_not_found' }, { status: 404 });

    const now = new Date();
    const [existing] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    let userId: string;
    let created = false;
    if (existing) {
      if (existing.role !== 'referrer' && existing.role !== 'admin') {
        return NextResponse.json({ error: 'email_in_use_non_staff' }, { status: 409 });
      }
      userId = existing.id;
    } else {
      if (!parsed.data.password) {
        return NextResponse.json({ error: 'password_required_for_new_user' }, { status: 400 });
      }
      userId = randomUUID();
      created = true;
      await db.insert(users).values({
        id: userId,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: 'referrer',
        displayName: parsed.data.displayName,
        createdAt: now,
      });
    }

    const [existingMembership] = await db
      .select({ id: clinicMemberships.id })
      .from(clinicMemberships)
      .where(and(eq(clinicMemberships.clinicId, clinicId), eq(clinicMemberships.userId, userId)))
      .limit(1);

    if (existingMembership) {
      await db
        .update(clinicMemberships)
        .set({ role: parsed.data.role })
        .where(eq(clinicMemberships.id, existingMembership.id));
    } else {
      await db.insert(clinicMemberships).values({
        id: randomUUID(),
        clinicId,
        userId,
        role: parsed.data.role,
        createdAt: now,
      });
    }

    void recordAudit({
      actorUserId: admin!.id,
      actorRole: admin!.role,
      action: 'clinic_member_added',
      targetType: 'clinic',
      targetId: clinicId,
      metadata: { userId, role: parsed.data.role, createdUser: created },
    });

    return NextResponse.json({ ok: true, userId, created });
  } catch (err) {
    logError('admin_clinic_add_member_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

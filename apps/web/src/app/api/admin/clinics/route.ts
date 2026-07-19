import { asc, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { clinicMemberships, clinics, users } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

/** List clinics and their staff memberships (admin only). */
export async function GET(request: Request) {
  try {
    const admin = await getUserFromRequest(request);
    if (!isAdminUser(admin)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const db = getDb();
    const clinicRows = await db
      .select({ id: clinics.id, name: clinics.name, slug: clinics.slug, city: clinics.city, status: clinics.status })
      .from(clinics)
      .orderBy(asc(clinics.name));

    const memberships = await db
      .select({
        id: clinicMemberships.id,
        clinicId: clinicMemberships.clinicId,
        userId: clinicMemberships.userId,
        role: clinicMemberships.role,
      })
      .from(clinicMemberships);

    const memberUserIds = [...new Set(memberships.map((m) => m.userId))];
    const memberUsers = memberUserIds.length
      ? await db
          .select({ id: users.id, email: users.email, displayName: users.displayName })
          .from(users)
          .where(inArray(users.id, memberUserIds))
      : [];
    const userById = Object.fromEntries(memberUsers.map((u) => [u.id, u]));

    return NextResponse.json({
      ok: true,
      clinics: clinicRows.map((c) => ({
        ...c,
        members: memberships
          .filter((m) => m.clinicId === c.id)
          .map((m) => ({
            membershipId: m.id,
            userId: m.userId,
            role: m.role,
            email: userById[m.userId]?.email ?? '(unknown)',
            displayName: userById[m.userId]?.displayName ?? null,
          })),
      })),
    });
  } catch (err) {
    logError('admin_clinics_list_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

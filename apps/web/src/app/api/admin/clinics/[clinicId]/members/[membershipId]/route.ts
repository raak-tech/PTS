import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { clinicMemberships } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { recordAudit } from '@/lib/audit';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type RouteContext = { params: Promise<{ clinicId: string; membershipId: string }> };

/** Remove a clinic staff membership (admin only). Leaves the user account intact. */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const admin = await getUserFromRequest(request);
    if (!isAdminUser(admin)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { clinicId, membershipId } = await context.params;
    const db = getDb();
    const [row] = await db
      .select({ id: clinicMemberships.id })
      .from(clinicMemberships)
      .where(and(eq(clinicMemberships.id, membershipId), eq(clinicMemberships.clinicId, clinicId)))
      .limit(1);
    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    await db.delete(clinicMemberships).where(eq(clinicMemberships.id, membershipId));

    void recordAudit({
      actorUserId: admin!.id,
      actorRole: admin!.role,
      action: 'clinic_member_removed',
      targetType: 'clinic',
      targetId: clinicId,
      metadata: { membershipId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('admin_clinic_remove_member_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

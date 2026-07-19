import { NextResponse } from 'next/server';

import { recordAudit } from '@/lib/audit';
import { canViewClinicAggregate, requireClinicActor } from '@/lib/clinic-access';
import { buildClinicDashboard } from '@/lib/clinic-dashboard';
import { currentMonthLabel } from '@/lib/clinic-engagement';
import { logError } from '@/lib/logger';

/** Aggregate, de-identified clinic outcomes (clinic_admin only). */
export async function GET(request: Request) {
  try {
    const actor = await requireClinicActor(request);
    if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (!canViewClinicAggregate(actor)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const url = new URL(request.url);
    const month = url.searchParams.get('month') ?? currentMonthLabel();
    const dashboard = await buildClinicDashboard(actor.clinicId, month);
    if (!dashboard) return NextResponse.json({ error: 'invalid_month' }, { status: 400 });

    void recordAudit({
      actorUserId: actor.userId,
      actorRole: `clinic_${actor.membershipRole}`,
      action: 'clinic_dashboard_viewed',
      targetType: 'clinic',
      targetId: actor.clinicId,
      metadata: { month },
    });

    return NextResponse.json({ ok: true, clinicName: actor.clinicName, dashboard });
  } catch (err) {
    logError('clinic_dashboard_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

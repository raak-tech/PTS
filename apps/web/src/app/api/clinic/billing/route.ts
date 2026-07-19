import { NextResponse } from 'next/server';

import { recordAudit } from '@/lib/audit';
import { canViewClinicAggregate, requireClinicActor } from '@/lib/clinic-access';
import { buildClinicBilling } from '@/lib/clinic-dashboard';
import { currentMonthLabel } from '@/lib/clinic-engagement';
import { logError } from '@/lib/logger';

/**
 * Active-patient billing meter (clinic_admin only). Supports `?format=csv` for a
 * de-identified export. Pilot invoices remain manual.
 */
export async function GET(request: Request) {
  try {
    const actor = await requireClinicActor(request);
    if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (!canViewClinicAggregate(actor)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const url = new URL(request.url);
    const month = url.searchParams.get('month') ?? currentMonthLabel();
    const format = url.searchParams.get('format');
    const billing = await buildClinicBilling(actor.clinicId, month);
    if (!billing) return NextResponse.json({ error: 'invalid_month' }, { status: 400 });

    void recordAudit({
      actorUserId: actor.userId,
      actorRole: `clinic_${actor.membershipRole}`,
      action: 'clinic_billing_viewed',
      targetType: 'clinic',
      targetId: actor.clinicId,
      metadata: { month, activePatients: billing.activePatients, format: format ?? 'json' },
    });

    if (format === 'csv') {
      const header = 'pseudo_id,status,engaged_days_in_month';
      const lines = billing.rows.map((r) => `${r.pseudoId},${r.status},${r.engagedDaysInMonth}`);
      const csv = [`# clinic=${actor.clinicSlug} month=${billing.month} active_patients=${billing.activePatients}`, header, ...lines].join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="clinic-billing-${actor.clinicSlug}-${billing.month}.csv"`,
        },
      });
    }

    return NextResponse.json({ ok: true, clinicName: actor.clinicName, billing });
  } catch (err) {
    logError('clinic_billing_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

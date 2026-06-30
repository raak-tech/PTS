import { NextResponse } from 'next/server';
import { z } from 'zod';

import { applyWeekToApprovedPlan } from '@/lib/apply-week-to-plan';
import { assertCounselorForClient } from '@/lib/client-access';
import type { WeekPlan } from '@/lib/plan-generator';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

const bodySchema = z.object({
  week: z.object({
    week: z.number().int().min(1).max(6),
    theme: z.string(),
    focus: z.string(),
    dailyPractices: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        duration: z.string(),
      }),
    ),
    weeklyReflection: z.string(),
    counselorNote: z.string(),
  }).passthrough(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id: clientId } = await context.params;
    if (!(await assertCounselorForClient(user.id, clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
    }

    const weekPlan = parsed.data.week as WeekPlan;
    const planId = await applyWeekToApprovedPlan(clientId, user.id, weekPlan);
    if (!planId) {
      return NextResponse.json({ error: 'no_approved_plan' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, planId, weekNumber: weekPlan.week });
  } catch (err) {
    logError('apply_week_error', err);
    const message = err instanceof Error ? err.message : 'internal';
    return NextResponse.json({ error: 'internal', detail: message }, { status: 500 });
  }
}

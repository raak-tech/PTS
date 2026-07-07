import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { planWeeks, plans, users } from '@/db/schema';
import { claimClientCounselor } from '@/lib/claim-client-counselor';
import { recordAudit } from '@/lib/audit';
import { sendPushToUser } from '@/lib/expo-push';
import { logError } from '@/lib/logger';
import type { GeneratedPlan, WeekPlan } from '@/lib/plan-generator';
import { toDateIso } from '@/lib/program-calendar';
import { seedDailyFromApprovedPlan } from '@/lib/seed-daily-from-plan';
import { getUserFromRequest } from '@/lib/session';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

const patchSchema = z.object({
  content: z.string().min(1).optional(),
  counselorWeekComment: z.string().max(4000).optional(),
});

// PATCH /api/provider/plans/[planId]/week/[weekNumber]
// Saves counselor edits to a specific week. Sets status to 'edited'.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ planId: string; weekNumber: string }> },
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') return unauthorized();

    const { planId, weekNumber } = await params;
    const weekNum = parseInt(weekNumber, 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
      return NextResponse.json({ error: 'invalid_week' }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    if (!parsed.data.content && parsed.data.counselorWeekComment === undefined) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    if (parsed.data.content) {
      try {
        JSON.parse(parsed.data.content);
      } catch {
        return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
      }
    }

    const db = getDb();

    // Verify the plan exists and belongs to a client assigned to this counselor
    const [planRow] = await db
      .select({ id: plans.id, userId: plans.userId })
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!planRow) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const now = new Date();

    // Upsert the plan_weeks row
    const existing = await db
      .select({ id: planWeeks.id })
      .from(planWeeks)
      .where(and(eq(planWeeks.planId, planId), eq(planWeeks.weekNumber, weekNum)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(planWeeks)
        .set({
          ...(parsed.data.content
            ? {
                content: parsed.data.content,
                status: 'edited',
                editedAt: now,
                counselorId: user.id,
              }
            : {}),
          ...(parsed.data.counselorWeekComment !== undefined
            ? { counselorWeekComment: parsed.data.counselorWeekComment.trim() || null }
            : {}),
        })
        .where(and(eq(planWeeks.planId, planId), eq(planWeeks.weekNumber, weekNum)));
    } else if (parsed.data.content) {
      const { randomUUID } = await import('node:crypto');
      await db.insert(planWeeks).values({
        id: randomUUID(),
        planId,
        weekNumber: weekNum,
        content: parsed.data.content,
        status: 'edited',
        editedAt: now,
        counselorId: user.id,
        counselorWeekComment: parsed.data.counselorWeekComment?.trim() || null,
        createdAt: now,
      });
    } else {
      return NextResponse.json({ error: 'week_not_found' }, { status: 404 });
    }

    await claimClientCounselor(planRow.userId, user.id);

    void recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'edit_week',
      targetType: 'plan_week',
      targetId: planId,
      metadata: { clientId: planRow.userId, weekNumber: weekNum },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('provider_plan_week_patch_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

// POST /api/provider/plans/[planId]/week/[weekNumber]
// Approves a specific week — sets status to 'approved' and releases it to the client.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ planId: string; weekNumber: string }> },
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') return unauthorized();

    const { planId, weekNumber } = await params;
    const weekNum = parseInt(weekNumber, 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
      return NextResponse.json({ error: 'invalid_week' }, { status: 400 });
    }

    const db = getDb();

    const [planRow] = await db
      .select({
        id: plans.id,
        userId: plans.userId,
        status: plans.status,
        generatedContent: plans.generatedContent,
        programAnchorDate: plans.programAnchorDate,
      })
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!planRow) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const now = new Date();

    const [existing] = await db
      .select({ id: planWeeks.id, status: planWeeks.status, content: planWeeks.content })
      .from(planWeeks)
      .where(and(eq(planWeeks.planId, planId), eq(planWeeks.weekNumber, weekNum)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'week_not_found' }, { status: 404 });
    }

    await db
      .update(planWeeks)
      .set({
        status: 'approved',
        approvedAt: now,
        releasedAt: now,
        counselorId: user.id,
      })
      .where(and(eq(planWeeks.planId, planId), eq(planWeeks.weekNumber, weekNum)));

    // Propagate the approved (possibly edited) week into the client-facing plan.
    // The client reads plans.generatedContent, while inline edits are stored in
    // plan_weeks.content — merge so counselor edits actually reach the client.
    let mergedContent = planRow.generatedContent;
    let approvedWeek: WeekPlan | null = null;
    try {
      approvedWeek = JSON.parse(existing.content) as WeekPlan;
      const plan = JSON.parse(planRow.generatedContent) as GeneratedPlan;
      const idx = plan.weeks.findIndex((w) => w.week === weekNum);
      if (idx >= 0) {
        plan.weeks[idx] = approvedWeek;
      } else {
        plan.weeks.push(approvedWeek);
        plan.weeks.sort((a, b) => a.week - b.week);
      }
      mergedContent = JSON.stringify(plan);
    } catch (err) {
      logError('provider_plan_week_merge_failed', err, { planId, weekNum });
    }

    // Flip the plan to approved on first release so the client can see it, and
    // anchor the program on Week 1. Idempotent for later weeks.
    const planUpdate: Record<string, unknown> = { generatedContent: mergedContent };
    if (planRow.status !== 'approved') {
      planUpdate.status = 'approved';
      planUpdate.approvedAt = now;
      planUpdate.approvedBy = user.id;
      planUpdate.counselorId = user.id;
    }
    if (weekNum === 1 && !planRow.programAnchorDate) {
      planUpdate.programAnchorDate = toDateIso(now);
    }
    await db.update(plans).set(planUpdate).where(eq(plans.id, planId));

    // Seed the daily layer (read-outs, calendar template) from the approved week.
    await seedDailyFromApprovedPlan(db, {
      clientId: planRow.userId,
      counselorId: user.id,
      planContent: mergedContent,
      planWeek: weekNum,
    });

    await claimClientCounselor(planRow.userId, user.id);

    void recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'approve_week',
      targetType: 'plan_week',
      targetId: planId,
      metadata: { clientId: planRow.userId, weekNumber: weekNum },
    });

    // Count how many weeks are now approved for this plan
    const approvedWeeks = await db
      .select({ weekNumber: planWeeks.weekNumber })
      .from(planWeeks)
      .where(and(eq(planWeeks.planId, planId), eq(planWeeks.status, 'approved')));

    // Push notification to client
    const [planRecord] = await db
      .select({ userId: plans.userId })
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (planRecord) {
      const [clientUser] = await db
        .select({ expoPushToken: users.expoPushToken })
        .from(users)
        .where(eq(users.id, planRecord.userId))
        .limit(1);

      const isFirstWeek = weekNum === 1;
      const title = isFirstWeek ? 'Your program starts now! 🎉' : `Week ${weekNum} unlocked`;
      const body = isFirstWeek
        ? 'Week 1 is live. Start your recovery program today.'
        : `Your counselor approved Week ${weekNum}. Open the app to continue.`;

      void sendPushToUser(clientUser?.expoPushToken, title, body, {
        action: 'week_approved',
        planId,
        weekNumber: weekNum,
      });
    }

    return NextResponse.json({ ok: true, approvedWeeks: approvedWeeks.length });
  } catch (err) {
    logError('provider_plan_week_approve_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

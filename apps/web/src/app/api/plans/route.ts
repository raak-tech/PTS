import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { clientCounselor, plans, users } from '@/db/schema';
import { sendPushToUser } from '@/lib/expo-push';
import { recordAudit } from '@/lib/audit';
import { logError } from '@/lib/logger';
import {
  applyHolisticVisibility,
  DEFAULT_HOLISTIC_VISIBILITY,
} from '@/lib/plan-holistic-edits';
import type { GeneratedPlan } from '@/lib/plan-generator';
import { regeneratePlanDraftForUser } from '@/lib/regenerate-plan-for-user';
import { seedDailyFromApprovedPlan } from '@/lib/seed-daily-from-plan';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { isAdminUser } from '@/lib/admin';
import { canAccessProviderConsole } from '@/lib/provider-console-access';
import { getUserFromRequest } from '@/lib/session';

export const maxDuration = 300;

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

// GET /api/plans?userId=<id>  — counselor fetches a client's plan
// GET /api/plans               — client fetches their own plan
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const targetUserId =
      user.role === 'provider' || isAdminUser(user)
      ? (searchParams.get('userId') ?? user.id)
      : user.id;

    const db = getDb();

    if (
      (user.role === 'provider' || isAdminUser(user)) &&
      targetUserId !== user.id &&
      !(await assertProviderCanAccessClient(user.id, targetUserId))
    ) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    let plan = null;
    if (user.role === 'client') {
      const [approved] = await db
        .select()
        .from(plans)
        .where(and(eq(plans.userId, targetUserId), eq(plans.status, 'approved')))
        .orderBy(desc(plans.createdAt))
        .limit(1);
      if (approved) {
        plan = approved;
      } else {
        const [draft] = await db
          .select()
          .from(plans)
          .where(eq(plans.userId, targetUserId))
          .orderBy(desc(plans.createdAt))
          .limit(1);
        plan = draft ?? null;
      }
    } else {
      const [latest] = await db
        .select()
        .from(plans)
        .where(eq(plans.userId, targetUserId))
        .orderBy(desc(plans.createdAt))
        .limit(1);
      plan = latest ?? null;
    }

    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    logError('plans_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

const approveSchema = z.object({
  planId: z.string().min(1),
  counselorNotes: z.string().max(2000).optional(),
  action: z.enum(['approve', 'regenerate']),
  holisticVisibility: z
    .object({
      ayurveda: z.boolean(),
      yoga: z.boolean(),
      music: z.boolean(),
    })
    .optional(),
});

// POST /api/plans  — counselor approves or requests regeneration
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const parsed = approveSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    const db = getDb();
    const now = new Date();

    if (parsed.data.action === 'approve') {
      const [planRow] = await db
        .select({
          id: plans.id,
          userId: plans.userId,
          generatedContent: plans.generatedContent,
        })
        .from(plans)
        .where(eq(plans.id, parsed.data.planId))
        .limit(1);

      if (!planRow) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }

      if (!(await assertProviderCanAccessClient(user.id, planRow.userId))) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }

      let planContent = planRow.generatedContent;
      try {
        const generated = JSON.parse(planRow.generatedContent) as GeneratedPlan;
        const visibility = parsed.data.holisticVisibility ?? DEFAULT_HOLISTIC_VISIBILITY;
        const adjusted = applyHolisticVisibility(generated, visibility);
        planContent = JSON.stringify(adjusted);
      } catch {
        /* keep original content if parse fails */
      }

      await db
        .update(plans)
        .set({
          status: 'approved',
          counselorId: user.id,
          counselorNotes: parsed.data.counselorNotes ?? null,
          approvedAt: now,
          approvedBy: user.id,
          generatedContent: planContent,
        })
        .where(eq(plans.id, parsed.data.planId));

      await db
        .insert(clientCounselor)
        .values({ clientId: planRow.userId, counselorId: user.id, assignedAt: now })
        .onConflictDoNothing();

      await seedDailyFromApprovedPlan(db, {
        clientId: planRow.userId,
        counselorId: user.id,
        planContent,
      });

      // Push notification: plan is live
      const [clientUser] = await db
        .select({ expoPushToken: users.expoPushToken })
        .from(users)
        .where(eq(users.id, planRow.userId))
        .limit(1);

      void sendPushToUser(
        clientUser?.expoPushToken,
        'Your personalized plan is ready 🎯',
        'Your counselor has approved your Week 1 program. Open the app to start.',
        { action: 'plan_approved', planId: planRow.id },
      );

      void recordAudit({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'approve_plan',
        targetType: 'plan',
        targetId: parsed.data.planId,
        metadata: { clientId: planRow.userId },
      });

      return NextResponse.json({ ok: true });
    }

    if (parsed.data.action === 'regenerate') {
      const [planRow] = await db
        .select({ userId: plans.userId })
        .from(plans)
        .where(eq(plans.id, parsed.data.planId))
        .limit(1);

      if (!planRow) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }

      if (!(await assertProviderCanAccessClient(user.id, planRow.userId))) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }

      const planId = await regeneratePlanDraftForUser(planRow.userId);
      if (!planId) {
        return NextResponse.json({ error: 'intake_missing' }, { status: 400 });
      }

      void recordAudit({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'regenerate_plan',
        targetType: 'plan',
        targetId: planId,
        metadata: { clientId: planRow.userId },
      });

      return NextResponse.json({ ok: true, status: 'draft', planId });
    }

    return NextResponse.json({ error: 'unsupported action' }, { status: 400 });
  } catch (err) {
    logError('plans_post_error', err);
    const message = err instanceof Error ? err.message : 'internal';
    return NextResponse.json({ error: 'internal', detail: message }, { status: 500 });
  }
}

import { and, desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { planWeeks, plans, users } from '@/db/schema';
import { getUserFromRequest } from '@/lib/session';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { canAccessProviderConsole } from '@/lib/provider-console-access';
import { getApprovedFormulation, getCurrentFormulation } from '@/lib/pain-script/formulation-store';
import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import { regeneratePlanDraftForUser } from '@/lib/regenerate-plan-for-user';
import { seedDraftPlanWeeks } from '@/lib/seed-plan-weeks';
import { recordAudit } from '@/lib/audit';
import { claimClientCounselor } from '@/lib/claim-client-counselor';
import { sendPushToUser } from '@/lib/expo-push';
import { log, logError } from '@/lib/logger';
import { displayEmail } from '@/lib/pii';
import type { GeneratedPlan } from '@/lib/plan-generator';

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user || !canAccessProviderConsole(user)) {
    return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { userId?: string };
  const { userId } = body;

  if (!userId) {
    return Response.json({ ok: false, reason: 'missing_user_id' }, { status: 400 });
  }

  if (!(await assertProviderCanAccessClient(user.id, userId))) {
    return Response.json({ ok: false, reason: 'forbidden' }, { status: 403 });
  }

  const cohort = await getUserPilotCohort(userId);
  if (usesPainScriptPath(cohort)) {
    const approved = await getApprovedFormulation(userId);
    if (!approved) {
      const current = await getCurrentFormulation(userId);
      return Response.json(
        {
          ok: false,
          reason: current ? 'formulation_not_approved' : 'formulation_missing',
          detail: 'Approve the clinical formulation before generating Week 1.',
        },
        { status: 400 },
      );
    }
  }

  const db = getDb();

  // Look at the most recent plan for this user. A plan row alone does not mean
  // Week 1 is ready — a draft can exist without a valid Week 1 plan_weeks row
  // (empty/failed LLM output), which used to leave the counselor stuck: hidden
  // from pending intakes, blocked here, and Week 1 shaded/unapprovable.
  const [existing] = await db
    .select({ id: plans.id, status: plans.status, generatedContent: plans.generatedContent })
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.createdAt))
    .limit(1);

  if (existing) {
    const [week1] = await db
      .select({ id: planWeeks.id })
      .from(planWeeks)
      .where(and(eq(planWeeks.planId, existing.id), eq(planWeeks.weekNumber, 1)))
      .limit(1);

    let droppedForRegen = false;

    if (week1) {
      // Pain Script: legacy Week 1 without formulationSummary is not Spec H–ready —
      // drop draft and regenerate from approved formulation.
      let missingPainSummary = false;
      if (usesPainScriptPath(cohort) && existing.status !== 'approved') {
        try {
          const parsed = JSON.parse(existing.generatedContent) as { formulationSummary?: string };
          missingPainSummary = !String(parsed.formulationSummary ?? '').trim();
        } catch {
          missingPainSummary = true;
        }
      }
      if (!missingPainSummary) {
        return Response.json({ ok: false, reason: 'plan_exists' }, { status: 200 });
      }
      await db.delete(planWeeks).where(eq(planWeeks.planId, existing.id));
      await db.delete(plans).where(eq(plans.id, existing.id));
      log('generate_plan_dropped_legacy_pain_draft', { userId, planId: existing.id });
      droppedForRegen = true;
    } else if (existing.status === 'approved') {
      // No Week 1 row. Never touch an approved plan.
      return Response.json({ ok: false, reason: 'plan_exists' }, { status: 200 });
    }

    if (!droppedForRegen) {
      // Draft plan missing Week 1 — try to repair cheaply from the existing
      // generated content before spending another LLM call.
      let repaired = false;
      try {
        const parsed = JSON.parse(existing.generatedContent) as GeneratedPlan;
        repaired = await seedDraftPlanWeeks(existing.id, parsed);
      } catch (err) {
        logError('generate_plan_repair_parse_failed', err, { userId, planId: existing.id });
      }

      if (repaired) {
        log('generate_plan_repaired', { userId, planId: existing.id });
        await claimClientCounselor(userId, user.id);
        return Response.json({ ok: true, planId: existing.id, repaired: true });
      }

      // Generated content is unusable — drop the broken draft and regenerate fresh.
      await db.delete(planWeeks).where(eq(planWeeks.planId, existing.id));
      await db.delete(plans).where(eq(plans.id, existing.id));
      log('generate_plan_dropped_broken_draft', { userId, planId: existing.id });
    }
  }

  // Generate a fresh Week 1 draft.
  let planId: string | null;
  try {
    planId = await regeneratePlanDraftForUser(userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'generation_failed';
    if (message === 'formulation_not_approved') {
      return Response.json({ ok: false, reason: 'formulation_not_approved' }, { status: 400 });
    }
    return Response.json({ ok: false, reason: 'generation_failed' }, { status: 500 });
  }
  if (!planId) {
    return Response.json({ ok: false, reason: 'generation_failed' }, { status: 500 });
  }

  await claimClientCounselor(userId, user.id);

  void recordAudit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'generate_plan',
    targetType: 'plan',
    targetId: planId,
    metadata: { clientId: userId },
  });

  // Send push notification to all admin users
  const adminUsers = await db
    .select({ expoPushToken: users.expoPushToken })
    .from(users)
    .where(eq(users.role, 'admin'));

  const clientRows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  const clientEmail = clientRows[0]?.email ?? 'unknown';
  const clientLabel = displayEmail(clientEmail);

  for (const admin of adminUsers) {
    if (admin.expoPushToken) {
      void sendPushToUser(
        admin.expoPushToken,
        'New plan draft ready',
        `Plan generated for ${clientLabel}`,
      );
    }
  }

  return Response.json({ ok: true, planId });
}

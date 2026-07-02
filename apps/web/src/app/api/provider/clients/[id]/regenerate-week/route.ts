import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { intakeResponses, planWeeks, plans } from '@/db/schema';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { recordAudit } from '@/lib/audit';
import type { GeneratedPlan, WeekPlan } from '@/lib/plan-generator';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';
import { buildWeeklySummary } from '@/lib/weekly-summary';
import { generateWeekPlan } from '@/lib/week-plan-generator';

export const maxDuration = 300;

const bodySchema = z.object({
  weekNumber: z.number().int().min(1).max(6),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id: clientId } = await context.params;
    if (!(await assertProviderCanAccessClient(user.id, clientId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const nextWeek = parsed.data.weekNumber + 1;
    if (nextWeek > 6) {
      return NextResponse.json({ error: 'max_week' }, { status: 400 });
    }

    const db = getDb();

    const [approvedPlan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.userId, clientId), eq(plans.status, 'approved')))
      .orderBy(desc(plans.createdAt))
      .limit(1);

    if (approvedPlan) {
      const [priorWeekRow] = await db
        .select({
          counselorWeekComment: planWeeks.counselorWeekComment,
          status: planWeeks.status,
        })
        .from(planWeeks)
        .where(
          and(
            eq(planWeeks.planId, approvedPlan.id),
            eq(planWeeks.weekNumber, parsed.data.weekNumber),
          ),
        )
        .limit(1);

      if (!priorWeekRow || priorWeekRow.status !== 'approved') {
        return NextResponse.json(
          { error: 'prior_week_not_approved', detail: `Week ${parsed.data.weekNumber} must be approved first.` },
          { status: 400 },
        );
      }

      if (!priorWeekRow.counselorWeekComment?.trim()) {
        return NextResponse.json(
          {
            error: 'counselor_comment_required',
            detail: `Add your clinical comment on Week ${parsed.data.weekNumber} before generating Week ${nextWeek}.`,
          },
          { status: 400 },
        );
      }
    }

    const [intake] = await db
      .select()
      .from(intakeResponses)
      .where(eq(intakeResponses.userId, clientId))
      .limit(1);

    if (!intake) {
      return NextResponse.json({ error: 'intake_missing' }, { status: 400 });
    }

    const summary = await buildWeeklySummary(clientId);

    let priorWeek: WeekPlan | undefined = summary.priorApprovedWeek ?? undefined;
    if (!priorWeek && approvedPlan) {
      const [priorRow] = await db
        .select({ content: planWeeks.content })
        .from(planWeeks)
        .where(
          and(
            eq(planWeeks.planId, approvedPlan.id),
            eq(planWeeks.weekNumber, parsed.data.weekNumber),
          ),
        )
        .limit(1);
      if (priorRow) {
        try {
          priorWeek = JSON.parse(priorRow.content) as WeekPlan;
        } catch {
          /* ignore */
        }
      }
    }

    if (!priorWeek) {
      const [draftPlan] = await db
        .select({ generatedContent: plans.generatedContent })
        .from(plans)
        .where(eq(plans.userId, clientId))
        .limit(1);
      if (draftPlan?.generatedContent) {
        try {
          const plan = JSON.parse(draftPlan.generatedContent) as GeneratedPlan;
          priorWeek = plan.weeks.find((w) => w.week === parsed.data.weekNumber);
        } catch {
          /* ignore */
        }
      }
    }

    const weekDraft = await generateWeekPlan({
      intake: {
        painSource: intake.painSource,
        painDescription: intake.painDescription,
        recoveryGoal: intake.recoveryGoal,
        ayurvedaPreferences: intake.ayurvedaPreferences,
      },
      weekNumber: nextWeek,
      summary,
      priorWeek,
      context: {
        userId: clientId,
        planId: approvedPlan?.id,
        weekNumber: nextWeek,
      },
    });

    const suggestions = [
      summary.blocksSkipped > summary.blocksCompleted
        ? 'Consider fewer or shorter evening blocks — skipped blocks outnumbered completions.'
        : 'Calendar adherence looks balanced — maintain current block types.',
      summary.reinforcementResponses < 3
        ? 'Increase reinforcement accountability — client recorded fewer than 3 responses this week.'
        : 'Reinforcement engagement is steady.',
      summary.painTrend ? summary.painTrend : null,
      ...summary.scheduleInsights.slice(0, 3),
    ].filter((line): line is string => Boolean(line));

    void recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'regenerate_week',
      targetType: 'plan_week',
      targetId: approvedPlan?.id ?? null,
      metadata: { clientId, weekNumber: nextWeek },
    });

    return NextResponse.json({
      ok: true,
      weekNumber: nextWeek,
      weekDraft,
      summary,
      suggestions,
    });
  } catch (err) {
    logError('regenerate_week_error', err);
    const message = err instanceof Error ? err.message : 'internal';
    return NextResponse.json({ error: 'internal', detail: message }, { status: 500 });
  }
}

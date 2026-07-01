import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { intakeResponses, plans } from '@/db/schema';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import type { GeneratedPlan } from '@/lib/plan-generator';
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
    const [intake] = await db
      .select()
      .from(intakeResponses)
      .where(eq(intakeResponses.userId, clientId))
      .limit(1);

    if (!intake) {
      return NextResponse.json({ error: 'intake_missing' }, { status: 400 });
    }

    const summary = await buildWeeklySummary(clientId);

    let priorWeek;
    const [approved] = await db
      .select({ generatedContent: plans.generatedContent })
      .from(plans)
      .where(and(eq(plans.userId, clientId), eq(plans.status, 'approved')))
      .limit(1);

    if (approved?.generatedContent) {
      try {
        const plan = JSON.parse(approved.generatedContent) as GeneratedPlan;
        priorWeek = plan.weeks.find((w) => w.week === parsed.data.weekNumber);
      } catch {
        /* ignore */
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
    });

    const suggestions = [
      summary.blocksSkipped > summary.blocksCompleted
        ? 'Consider fewer or shorter evening blocks — skipped blocks outnumbered completions.'
        : 'Calendar adherence looks balanced — maintain current block types.',
      summary.reinforcementResponses < 3
        ? 'Increase reinforcement accountability — client recorded fewer than 3 responses this week.'
        : 'Reinforcement engagement is steady.',
      ...summary.scheduleInsights.slice(0, 3),
    ];

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

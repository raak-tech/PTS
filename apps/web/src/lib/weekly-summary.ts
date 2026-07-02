import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  dailyCalendarEntries,
  dailyCheckIns,
  dailyReinforcements,
  dailyScheduleFeedback,
  eveningReflections,
  holisticCompletions,
  planWeeks,
  plans,
  reinforcementResponses,
  supportArtifacts,
  weeklyCheckIns,
} from '@/db/schema';
import { formatWeeklyCheckInSummary, parseWeeklyCheckInAnswers } from '@/lib/check-in-prompts';
import { isDateInRange, localDateIso, parseCalendarBlocks } from '@/lib/daily-layer';
import type { WeekPlan } from '@/lib/plan-generator';

export type WeeklySummary = {
  weekStart: string;
  weekEnd: string;
  reinforcementResponses: number;
  reinforcementDaysActive: number;
  calendarDaysPlanned: number;
  blocksCompleted: number;
  blocksPartial: number;
  blocksSkipped: number;
  scheduleFeedbackCount: number;
  scheduleInsights: string[];
  eveningReflectionCount: number;
  latestWeeklyCheckIn: string | null;
  morningCheckIns: { dateIso: string; painLevel: number; sleepQuality: string; intention: string | null }[];
  painTrend: string | null;
  holisticCompletions: { activityType: string; count: number }[];
  readOutSummaries: string[];
  eveningReflectionSamples: string[];
  clientShares: string[];
  counselorPriorWeekComment: string | null;
  priorApprovedWeek: WeekPlan | null;
};

export async function buildWeeklySummary(clientId: string, weekStart?: string): Promise<WeeklySummary> {
  const db = getDb();
  const start = weekStart ?? localDateIso();
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const end = localDateIso(endDate);

  const reinforcements = (await db
    .select()
    .from(dailyReinforcements)
    .where(eq(dailyReinforcements.clientId, clientId))) as {
    id: string;
    startDate: string;
    endDate: string;
  }[];

  const activeReinforcements = reinforcements.filter((r) =>
    isDateInRange(start, r.startDate, r.endDate) || isDateInRange(end, r.startDate, r.endDate),
  );

  const responses = (await db
    .select()
    .from(reinforcementResponses)
    .where(eq(reinforcementResponses.clientId, clientId))) as {
    reinforcementId: string;
    submittedAt: Date;
    responseType: string;
    bodyText: string | null;
    audioUrl: string | null;
  }[];

  const weekResponses = responses.filter((r) => {
    const day = localDateIso(r.submittedAt);
    return day >= start && day <= end;
  });

  const readOutSummaries = weekResponses
    .map((r) => {
      if (r.responseType === 'text' && r.bodyText?.trim()) {
        return r.bodyText.trim().slice(0, 280);
      }
      if (r.responseType === 'voice') {
        return r.audioUrl ? '[Voice read-out recorded]' : '[Voice read-out]';
      }
      return null;
    })
    .filter((line): line is string => Boolean(line))
    .slice(0, 8);

  const calendars = await db
    .select()
    .from(dailyCalendarEntries)
    .where(
      and(
        eq(dailyCalendarEntries.clientId, clientId),
        gte(dailyCalendarEntries.dateIso, start),
        lte(dailyCalendarEntries.dateIso, end),
      ),
    );

  let blocksCompleted = 0;
  let blocksPartial = 0;
  let blocksSkipped = 0;
  for (const entry of calendars) {
    for (const block of parseCalendarBlocks(entry.blocks)) {
      if (block.status === 'done') blocksCompleted += 1;
      if (block.status === 'partial') blocksPartial += 1;
      if (block.status === 'skipped') blocksSkipped += 1;
    }
  }

  const feedbackRows = await db
    .select()
    .from(dailyScheduleFeedback)
    .where(
      and(
        eq(dailyScheduleFeedback.clientId, clientId),
        gte(dailyScheduleFeedback.dateIso, start),
        lte(dailyScheduleFeedback.dateIso, end),
      ),
    );

  const scheduleInsights: string[] = [];
  for (const row of feedbackRows) {
    if (row.workedText?.trim()) scheduleInsights.push(`Worked (${row.dateIso}): ${row.workedText.trim()}`);
    if (row.didntWorkText?.trim()) scheduleInsights.push(`Didn't work (${row.dateIso}): ${row.didntWorkText.trim()}`);
  }

  const reflectionRows = await db
    .select()
    .from(eveningReflections)
    .where(
      and(
        eq(eveningReflections.clientId, clientId),
        gte(eveningReflections.dateIso, start),
        lte(eveningReflections.dateIso, end),
      ),
    );

  const eveningReflectionSamples = reflectionRows
    .map((r: { bodyText: string }) => r.bodyText.trim())
    .filter(Boolean)
    .slice(0, 5);

  const [latestCheckIn] = await db
    .select()
    .from(weeklyCheckIns)
    .where(eq(weeklyCheckIns.clientId, clientId))
    .orderBy(desc(weeklyCheckIns.weekNumber))
    .limit(1);

  const latestWeeklyCheckIn = latestCheckIn
    ? formatWeeklyCheckInSummary(parseWeeklyCheckInAnswers(latestCheckIn.answersJson))
    : null;

  const checkInRows = await db
    .select()
    .from(dailyCheckIns)
    .where(
      and(
        eq(dailyCheckIns.clientId, clientId),
        gte(dailyCheckIns.dateIso, start),
        lte(dailyCheckIns.dateIso, end),
      ),
    );

  const morningCheckIns = (checkInRows as {
    dateIso: string;
    painLevel: number;
    sleepQuality: string;
    intention: string | null;
  }[]).map((row) => ({
    dateIso: row.dateIso,
    painLevel: row.painLevel,
    sleepQuality: row.sleepQuality,
    intention: row.intention,
  }));

  let painTrend: string | null = null;
  if (morningCheckIns.length >= 2) {
    const first = morningCheckIns[0].painLevel;
    const last = morningCheckIns[morningCheckIns.length - 1].painLevel;
    const delta = last - first;
    painTrend =
      delta > 0
        ? `Pain rose from ${first} to ${last} this week (+${delta})`
        : delta < 0
          ? `Pain eased from ${first} to ${last} this week (${delta})`
          : `Pain steady around ${last}/10`;
  } else if (morningCheckIns.length === 1) {
    painTrend = `Latest pain ${morningCheckIns[0].painLevel}/10, sleep ${morningCheckIns[0].sleepQuality}`;
  }

  const holisticRows = await db
    .select()
    .from(holisticCompletions)
    .where(
      and(
        eq(holisticCompletions.clientId, clientId),
        gte(holisticCompletions.dateIso, start),
        lte(holisticCompletions.dateIso, end),
      ),
    );

  const holisticCounts: Record<string, number> = {};
  for (const row of holisticRows as { activityType: string }[]) {
    holisticCounts[row.activityType] = (holisticCounts[row.activityType] ?? 0) + 1;
  }
  const holisticCompletionsSummary = Object.entries(holisticCounts).map(([activityType, count]) => ({
    activityType,
    count,
  }));

  const shareRows = await db
    .select()
    .from(supportArtifacts)
    .where(and(eq(supportArtifacts.userId, clientId), eq(supportArtifacts.kind, 'counselor-share')))
    .orderBy(desc(supportArtifacts.createdAt))
    .limit(10);

  const clientShares = (shareRows as { title: string; bodyText: string }[]).map(
    (row) => `${row.title}: ${row.bodyText.trim().slice(0, 400)}`,
  );

  let counselorPriorWeekComment: string | null = null;
  let priorApprovedWeek: WeekPlan | null = null;

  const [approvedPlan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(and(eq(plans.userId, clientId), eq(plans.status, 'approved')))
    .orderBy(desc(plans.createdAt))
    .limit(1);

  if (approvedPlan) {
    const priorWeekRows = await db
      .select()
      .from(planWeeks)
      .where(and(eq(planWeeks.planId, approvedPlan.id), eq(planWeeks.status, 'approved')))
      .orderBy(desc(planWeeks.weekNumber))
      .limit(1);

    const priorRow = priorWeekRows[0];
    if (priorRow) {
      counselorPriorWeekComment = priorRow.counselorWeekComment ?? null;
      try {
        priorApprovedWeek = JSON.parse(priorRow.content) as WeekPlan;
      } catch {
        priorApprovedWeek = null;
      }
    }
  }

  return {
    weekStart: start,
    weekEnd: end,
    reinforcementResponses: weekResponses.length,
    reinforcementDaysActive: activeReinforcements.length,
    calendarDaysPlanned: calendars.length,
    blocksCompleted,
    blocksPartial,
    blocksSkipped,
    scheduleFeedbackCount: feedbackRows.length,
    scheduleInsights,
    eveningReflectionCount: reflectionRows.length,
    latestWeeklyCheckIn,
    morningCheckIns,
    painTrend,
    holisticCompletions: holisticCompletionsSummary,
    readOutSummaries,
    eveningReflectionSamples,
    clientShares,
    counselorPriorWeekComment,
    priorApprovedWeek,
  };
}

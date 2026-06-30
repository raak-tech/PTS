import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  dailyCalendarEntries,
  dailyReinforcements,
  dailyScheduleFeedback,
  eveningReflections,
  reinforcementResponses,
  weeklyCheckIns,
} from '@/db/schema';
import { formatWeeklyCheckInSummary, parseWeeklyCheckInAnswers } from '@/lib/check-in-prompts';
import { isDateInRange, localDateIso, parseCalendarBlocks } from '@/lib/daily-layer';

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
    startDate: string;
    endDate: string;
  }[];

  const activeReinforcements = reinforcements.filter((r) =>
    isDateInRange(start, r.startDate, r.endDate) || isDateInRange(end, r.startDate, r.endDate),
  );

  const responses = (await db
    .select()
    .from(reinforcementResponses)
    .where(eq(reinforcementResponses.clientId, clientId))) as { submittedAt: Date }[];

  const weekResponses = responses.filter((r) => {
    const day = localDateIso(r.submittedAt);
    return day >= start && day <= end;
  });

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

  const [latestCheckIn] = await db
    .select()
    .from(weeklyCheckIns)
    .where(eq(weeklyCheckIns.clientId, clientId))
    .orderBy(desc(weeklyCheckIns.weekNumber))
    .limit(1);

  const latestWeeklyCheckIn = latestCheckIn
    ? formatWeeklyCheckInSummary(parseWeeklyCheckInAnswers(latestCheckIn.answersJson))
    : null;

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
  };
}

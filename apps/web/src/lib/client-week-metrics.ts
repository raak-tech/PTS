import { and, desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { planWeeks, plans } from '@/db/schema';
import { toDateIso, weekDateRange } from '@/lib/program-calendar';
import { buildWeeklySummary } from '@/lib/weekly-summary';

export type WeekMetric = {
  week: number;
  weekStart: string;
  weekEnd: string;
  readOuts: number;
  blocksCompleted: number;
  blocksPartial: number;
  blocksSkipped: number;
  blockCompletionPct: number | null;
  checkIns: number;
  avgPain: number | null;
  reflections: number;
  holisticTotal: number;
};

export type ProgramMetrics = {
  anchored: boolean;
  weeks: WeekMetric[];
  patterns: string[];
};

function trendLabel(first: number, last: number, unit: string): string {
  const delta = Math.round((last - first) * 10) / 10;
  if (delta > 0) return `up ${delta}${unit}`;
  if (delta < 0) return `down ${Math.abs(delta)}${unit}`;
  return `flat${unit ? ` (${last}${unit})` : ''}`;
}

/**
 * Cross-week engagement metrics for a client's program so the counselor can
 * spot patterns (adherence, read-out engagement, pain) across all weeks that
 * have been released so far.
 */
export async function buildProgramMetrics(clientId: string): Promise<ProgramMetrics> {
  const db = getDb();

  const [plan] = await db
    .select({
      id: plans.id,
      programAnchorDate: plans.programAnchorDate,
      approvedAt: plans.approvedAt,
    })
    .from(plans)
    .where(eq(plans.userId, clientId))
    .orderBy(desc(plans.createdAt))
    .limit(1);

  const anchor = plan?.programAnchorDate ?? (plan?.approvedAt ? toDateIso(plan.approvedAt) : null);
  if (!plan || !anchor) {
    return { anchored: false, weeks: [], patterns: [] };
  }

  const approvedRows: { weekNumber: number }[] = await db
    .select({ weekNumber: planWeeks.weekNumber })
    .from(planWeeks)
    .where(and(eq(planWeeks.planId, plan.id), eq(planWeeks.status, 'approved')))
    .orderBy(planWeeks.weekNumber);

  const weekNumbers = approvedRows.map((r) => r.weekNumber).filter((w) => w >= 1 && w <= 6);
  if (weekNumbers.length === 0) {
    return { anchored: true, weeks: [], patterns: [] };
  }

  const weeks: WeekMetric[] = [];
  for (const week of weekNumbers) {
    const { start } = weekDateRange(anchor, week);
    const summary = await buildWeeklySummary(clientId, start);
    const blocksTotal = summary.blocksCompleted + summary.blocksPartial + summary.blocksSkipped;
    const avgPain =
      summary.morningCheckIns.length > 0
        ? Math.round(
            (summary.morningCheckIns.reduce((sum, c) => sum + c.painLevel, 0) / summary.morningCheckIns.length) * 10,
          ) / 10
        : null;

    weeks.push({
      week,
      weekStart: summary.weekStart,
      weekEnd: summary.weekEnd,
      readOuts: summary.reinforcementResponses,
      blocksCompleted: summary.blocksCompleted,
      blocksPartial: summary.blocksPartial,
      blocksSkipped: summary.blocksSkipped,
      blockCompletionPct: blocksTotal > 0 ? Math.round((summary.blocksCompleted / blocksTotal) * 100) : null,
      checkIns: summary.morningCheckIns.length,
      avgPain,
      reflections: summary.eveningReflectionCount,
      holisticTotal: summary.holisticCompletions.reduce((sum, h) => sum + h.count, 0),
    });
  }

  const patterns: string[] = [];
  if (weeks.length >= 2) {
    const withAdherence = weeks.filter((w) => w.blockCompletionPct !== null);
    if (withAdherence.length >= 2) {
      const first = withAdherence[0];
      const last = withAdherence[withAdherence.length - 1];
      patterns.push(
        `Calendar adherence Week ${first.week}→${last.week}: ${trendLabel(first.blockCompletionPct!, last.blockCompletionPct!, '%')} (${first.blockCompletionPct}% → ${last.blockCompletionPct}%).`,
      );
    }

    const firstReadOut = weeks[0];
    const lastReadOut = weeks[weeks.length - 1];
    patterns.push(
      `Read-out responses Week ${firstReadOut.week}→${lastReadOut.week}: ${trendLabel(firstReadOut.readOuts, lastReadOut.readOuts, '')} (${firstReadOut.readOuts} → ${lastReadOut.readOuts}).`,
    );

    const withPain = weeks.filter((w) => w.avgPain !== null);
    if (withPain.length >= 2) {
      const first = withPain[0];
      const last = withPain[withPain.length - 1];
      patterns.push(
        `Average pain Week ${first.week}→${last.week}: ${trendLabel(first.avgPain!, last.avgPain!, '/10')} (${first.avgPain} → ${last.avgPain}).`,
      );
    }
  }

  const disengaged = weeks.filter((w) => w.checkIns === 0 && w.readOuts === 0);
  if (disengaged.length > 0) {
    patterns.push(
      `Low engagement (no check-ins or read-outs) in Week ${disengaged.map((w) => w.week).join(', ')} — consider a nudge.`,
    );
  }

  return { anchored: true, weeks, patterns };
}

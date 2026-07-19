import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { clinicEnrollments, outcomeMeasures } from '@/db/schema';
import {
  getPhysioSelfReports,
  getPtsEngagement,
  monthRange,
} from '@/lib/clinic-engagement';
import { AGGREGATE_DELTA_INSTRUMENTS, INSTRUMENTS } from '@/lib/outcome-instruments';

/** Cells derived from fewer than this many patients are suppressed. */
export const MIN_CELL_N = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SuppressibleRate = { value: number | null; n: number; suppressed: boolean };
export type SuppressibleDelta = {
  mean: number | null;
  n: number;
  suppressed: boolean;
  betterDirection: 'lower' | 'higher';
  label: string;
};

export type ClinicDashboard = {
  clinic: { id: string };
  counts: { enrolled: number; activeThisMonth: number; graduated: number; withdrawn: number };
  ptsEngagement: {
    engagedLast7: SuppressibleRate;
    meanEngagedDays30: number | null;
    n: number;
  };
  physioSelfReport: { meanCompletionPct: SuppressibleRate };
  retention: {
    day7: SuppressibleRate;
    day14: SuppressibleRate;
    week6: SuppressibleRate;
  };
  outcomeDeltas: SuppressibleDelta[];
  dropoutStage: { label: string; count: number }[] | null;
  month: string;
};

function rate(numerator: number, denominator: number): SuppressibleRate {
  if (denominator < MIN_CELL_N) return { value: null, n: denominator, suppressed: true };
  return { value: Math.round((numerator / denominator) * 100), n: denominator, suppressed: false };
}

/**
 * Aggregate, de-identified clinic outcomes. Only consented patients are counted.
 * PTS program engagement and self-reported physio completion are separate
 * metrics. Cells with n < 5 are suppressed.
 */
export async function buildClinicDashboard(clinicId: string, month: string): Promise<ClinicDashboard | null> {
  const range = monthRange(month);
  if (!range) return null;

  const db = getDb();
  const enrollments = await db
    .select({
      clientUserId: clinicEnrollments.clientUserId,
      status: clinicEnrollments.status,
      enrolledAt: clinicEnrollments.enrolledAt,
      consentSharedWithClinic: clinicEnrollments.consentSharedWithClinic,
      consentWithdrawnAt: clinicEnrollments.consentWithdrawnAt,
    })
    .from(clinicEnrollments)
    .where(eq(clinicEnrollments.clinicId, clinicId));

  const consented = enrollments.filter(
    (e) => e.consentSharedWithClinic && e.consentWithdrawnAt == null,
  );
  const clientIds = consented.map((e) => e.clientUserId);
  const now = new Date();

  const counts = {
    enrolled: consented.filter((e) => e.status === 'enrolled' || e.status === 'active').length,
    activeThisMonth: 0,
    graduated: consented.filter((e) => e.status === 'graduated').length,
    withdrawn: consented.filter((e) => e.status === 'withdrawn').length,
  };

  const empty: ClinicDashboard = {
    clinic: { id: clinicId },
    counts,
    ptsEngagement: { engagedLast7: rate(0, 0), meanEngagedDays30: null, n: 0 },
    physioSelfReport: { meanCompletionPct: rate(0, 0) },
    retention: { day7: rate(0, 0), day14: rate(0, 0), week6: rate(0, 0) },
    outcomeDeltas: [],
    dropoutStage: null,
    month: range.label,
  };
  if (clientIds.length === 0) return empty;

  const earliest = consented.reduce<Date | null>((min, e) => {
    if (!e.enrolledAt) return min;
    return !min || e.enrolledAt < min ? e.enrolledAt : min;
  }, null);
  const historyStart = earliest ?? new Date(0);

  const [engagementAll, engagement30, physio30, outcomeRows] = await Promise.all([
    getPtsEngagement(clientIds, historyStart, now),
    getPtsEngagement(clientIds, new Date(now.getTime() - 30 * DAY_MS), now),
    getPhysioSelfReports(clientIds, new Date(now.getTime() - 30 * DAY_MS), now),
    db
      .select({
        userId: outcomeMeasures.userId,
        phase: outcomeMeasures.phase,
        instrument: outcomeMeasures.instrument,
        score: outcomeMeasures.score,
      })
      .from(outcomeMeasures),
  ]);

  const activeThisMonthEngagement = await getPtsEngagement(clientIds, range.start, range.end);
  counts.activeThisMonth = consented.filter((e) => {
    if (e.status !== 'active' && e.status !== 'enrolled' && e.status !== 'graduated') return false;
    return (activeThisMonthEngagement[e.clientUserId]?.events ?? 0) > 0;
  }).length;

  // PTS engagement (non-withdrawn denominator).
  const inProgram = consented.filter((e) => e.status !== 'withdrawn');
  const engaged7 = inProgram.filter((e) => {
    const last = engagementAll[e.clientUserId]?.lastAt;
    return last != null && now.getTime() - last.getTime() <= 7 * DAY_MS;
  }).length;
  const engaged30Days = inProgram
    .map((e) => engagement30[e.clientUserId]?.days.size ?? 0)
    .filter((d) => d > 0);
  const meanEngagedDays30 =
    engaged30Days.length > 0
      ? Math.round((engaged30Days.reduce((a, b) => a + b, 0) / engaged30Days.length) * 10) / 10
      : null;

  // Self-reported physio completion (patients with ≥1 report as denominator).
  const physioPcts: number[] = [];
  for (const id of clientIds) {
    const p = physio30[id];
    if (!p || p.total === 0) continue;
    physioPcts.push(((p.yes + p.partly * 0.5) / p.total) * 100);
  }
  const physioMean =
    physioPcts.length > 0 ? physioPcts.reduce((a, b) => a + b, 0) / physioPcts.length : 0;

  // Retention: eligible = enrolled ≥ N days ago; retained = last engagement ≥ N days after enrol.
  const retentionAt = (days: number): SuppressibleRate => {
    const eligible = consented.filter(
      (e) => e.enrolledAt != null && now.getTime() - e.enrolledAt.getTime() >= days * DAY_MS,
    );
    const retained = eligible.filter((e) => {
      const last = engagementAll[e.clientUserId]?.lastAt;
      return last != null && e.enrolledAt != null && last.getTime() - e.enrolledAt.getTime() >= days * DAY_MS;
    });
    return rate(retained.length, eligible.length);
  };

  // Outcome deltas (Week 6 − baseline) per instrument, across patients with both.
  type Pair = { baseline?: number; week6?: number };
  const byUser: Record<string, Record<string, Pair>> = {};
  const consentedSet = new Set(clientIds);
  for (const r of outcomeRows) {
    if (!consentedSet.has(r.userId)) continue;
    const u = (byUser[r.userId] ??= {});
    const pair = (u[r.instrument] ??= {});
    if (r.phase === 'baseline') pair.baseline = r.score;
    else if (r.phase === 'week6') pair.week6 = r.score;
  }
  const outcomeDeltas: SuppressibleDelta[] = AGGREGATE_DELTA_INSTRUMENTS.map((instrument) => {
    const deltas: number[] = [];
    for (const id of clientIds) {
      const pair = byUser[id]?.[instrument];
      if (pair && pair.baseline != null && pair.week6 != null) {
        deltas.push(pair.week6 - pair.baseline);
      }
    }
    const n = deltas.length;
    const mean = n > 0 ? Math.round((deltas.reduce((a, b) => a + b, 0) / n) * 10) / 10 : null;
    return {
      label: INSTRUMENTS[instrument].title,
      betterDirection: INSTRUMENTS[instrument].betterDirection,
      mean: n >= MIN_CELL_N ? mean : null,
      n,
      suppressed: n < MIN_CELL_N,
    };
  });

  // Dropout stage (withdrawn only), suppressed if fewer than MIN_CELL_N withdrew.
  const withdrawn = consented.filter((e) => e.status === 'withdrawn');
  let dropoutStage: { label: string; count: number }[] | null = null;
  if (withdrawn.length >= MIN_CELL_N) {
    const buckets: Record<string, number> = { 'Week 0–1': 0, 'Week 2–3': 0, 'Week 4+': 0 };
    for (const e of withdrawn) {
      const weeks = e.enrolledAt ? Math.floor((now.getTime() - e.enrolledAt.getTime()) / (7 * DAY_MS)) : 0;
      if (weeks <= 1) buckets['Week 0–1'] += 1;
      else if (weeks <= 3) buckets['Week 2–3'] += 1;
      else buckets['Week 4+'] += 1;
    }
    dropoutStage = Object.entries(buckets).map(([label, count]) => ({ label, count }));
  }

  return {
    clinic: { id: clinicId },
    counts,
    ptsEngagement: {
      engagedLast7: rate(engaged7, inProgram.length),
      meanEngagedDays30,
      n: inProgram.length,
    },
    physioSelfReport: {
      meanCompletionPct:
        physioPcts.length < MIN_CELL_N
          ? { value: null, n: physioPcts.length, suppressed: true }
          : { value: Math.round(physioMean), n: physioPcts.length, suppressed: false },
    },
    retention: { day7: retentionAt(7), day14: retentionAt(14), week6: retentionAt(42) },
    outcomeDeltas,
    dropoutStage,
    month: range.label,
  };
}

export type BillingResult = {
  clinicId: string;
  month: string;
  activePatients: number;
  rows: { pseudoId: string; status: string; engagedDaysInMonth: number }[];
};

/**
 * Active-patient billing meter for a month: status active/graduated/enrolled AND
 * ≥1 PTS engagement in the calendar month. De-identified pseudo-IDs only.
 */
export async function buildClinicBilling(clinicId: string, month: string): Promise<BillingResult | null> {
  const range = monthRange(month);
  if (!range) return null;

  const db = getDb();
  const enrollments = await db
    .select({
      clientUserId: clinicEnrollments.clientUserId,
      status: clinicEnrollments.status,
      consentSharedWithClinic: clinicEnrollments.consentSharedWithClinic,
      consentWithdrawnAt: clinicEnrollments.consentWithdrawnAt,
    })
    .from(clinicEnrollments)
    .where(eq(clinicEnrollments.clinicId, clinicId));

  const consented = enrollments.filter(
    (e) => e.consentSharedWithClinic && e.consentWithdrawnAt == null,
  );
  const clientIds = consented.map((e) => e.clientUserId);
  const engagement = await getPtsEngagement(clientIds, range.start, range.end);

  const rows = consented
    .filter((e) => ['enrolled', 'active', 'graduated'].includes(e.status))
    .map((e) => ({
      clientUserId: e.clientUserId,
      status: e.status,
      engagedDaysInMonth: engagement[e.clientUserId]?.days.size ?? 0,
    }))
    .filter((r) => r.engagedDaysInMonth > 0)
    .map((r) => ({
      pseudoId: `PT-${r.clientUserId.slice(-6).toUpperCase()}`,
      status: r.status,
      engagedDaysInMonth: r.engagedDaysInMonth,
    }));

  return { clinicId, month: range.label, activePatients: rows.length, rows };
}

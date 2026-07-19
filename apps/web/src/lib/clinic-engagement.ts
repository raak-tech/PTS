import { and, gte, inArray, lt } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  dailyCheckIns,
  holisticCompletions,
  physioSelfReports,
  reinforcementResponses,
} from '@/db/schema';

/**
 * PTS program engagement = completing PTS's own psychological practices
 * (morning check-in, read-out response, holistic practice). This is NEVER the
 * physiotherapist's home-exercise adherence — that is a separate self-report
 * signal (see physio_self_reports).
 */

export type MonthRange = { start: Date; end: Date; label: string };

/** Calendar-month range in server local time for a 'YYYY-MM' label. */
export function monthRange(month: string): MonthRange | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const mon = Number(m[2]);
  if (mon < 1 || mon > 12) return null;
  const start = new Date(year, mon - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, mon, 1, 0, 0, 0, 0);
  return { start, end, label: month };
}

export function currentMonthLabel(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export type EngagementByClient = Record<
  string,
  { events: number; lastAt: Date | null; days: Set<string> }
>;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Union of PTS engagement events per client in [start, end): morning check-ins,
 * read-out (reinforcement) responses, and holistic practice completions.
 */
export async function getPtsEngagement(
  clientIds: string[],
  start: Date,
  end: Date,
): Promise<EngagementByClient> {
  const result: EngagementByClient = {};
  if (clientIds.length === 0) return result;
  const db = getDb();

  const add = (clientId: string, at: Date) => {
    const bucket = (result[clientId] ??= { events: 0, lastAt: null, days: new Set() });
    bucket.events += 1;
    bucket.days.add(dayKey(at));
    if (!bucket.lastAt || at > bucket.lastAt) bucket.lastAt = at;
  };

  const [checkIns, readouts, holistic] = await Promise.all([
    db
      .select({ clientId: dailyCheckIns.clientId, at: dailyCheckIns.submittedAt })
      .from(dailyCheckIns)
      .where(
        and(
          inArray(dailyCheckIns.clientId, clientIds),
          gte(dailyCheckIns.submittedAt, start),
          lt(dailyCheckIns.submittedAt, end),
        ),
      ),
    db
      .select({ clientId: reinforcementResponses.clientId, at: reinforcementResponses.submittedAt })
      .from(reinforcementResponses)
      .where(
        and(
          inArray(reinforcementResponses.clientId, clientIds),
          gte(reinforcementResponses.submittedAt, start),
          lt(reinforcementResponses.submittedAt, end),
        ),
      ),
    db
      .select({ clientId: holisticCompletions.clientId, at: holisticCompletions.completedAt })
      .from(holisticCompletions)
      .where(
        and(
          inArray(holisticCompletions.clientId, clientIds),
          gte(holisticCompletions.completedAt, start),
          lt(holisticCompletions.completedAt, end),
        ),
      ),
  ]);

  for (const r of checkIns) add(r.clientId, r.at);
  for (const r of readouts) add(r.clientId, r.at);
  for (const r of holistic) add(r.clientId, r.at);

  return result;
}

/** Active patient (billing/dashboard): ≥1 PTS engagement event in [start, end). */
export async function getActiveClientIds(
  clientIds: string[],
  start: Date,
  end: Date,
): Promise<Set<string>> {
  const engagement = await getPtsEngagement(clientIds, start, end);
  return new Set(Object.keys(engagement).filter((id) => engagement[id].events > 0));
}

export type PhysioSelfReportSummary = Record<
  string,
  { yes: number; partly: number; no: number; total: number; lastStatus: string | null }
>;

/** Patient self-reported physio-exercise completion in [start, end). */
export async function getPhysioSelfReports(
  clientIds: string[],
  start: Date,
  end: Date,
): Promise<PhysioSelfReportSummary> {
  const result: PhysioSelfReportSummary = {};
  if (clientIds.length === 0) return result;
  const db = getDb();

  const rows = await db
    .select({
      clientId: physioSelfReports.clientId,
      status: physioSelfReports.status,
      submittedAt: physioSelfReports.submittedAt,
    })
    .from(physioSelfReports)
    .where(
      and(
        inArray(physioSelfReports.clientId, clientIds),
        gte(physioSelfReports.submittedAt, start),
        lt(physioSelfReports.submittedAt, end),
      ),
    );

  const lastAt: Record<string, Date> = {};
  for (const r of rows) {
    const bucket = (result[r.clientId] ??= {
      yes: 0,
      partly: 0,
      no: 0,
      total: 0,
      lastStatus: null,
    });
    if (r.status === 'yes') bucket.yes += 1;
    else if (r.status === 'partly') bucket.partly += 1;
    else if (r.status === 'no') bucket.no += 1;
    bucket.total += 1;
    if (!lastAt[r.clientId] || r.submittedAt > lastAt[r.clientId]) {
      lastAt[r.clientId] = r.submittedAt;
      bucket.lastStatus = r.status;
    }
  }
  return result;
}

/** Coarse engagement state for the referrer projection (never raw content). */
export function coarseEngagementState(lastAt: Date | null, now = new Date()): 'active' | 'slipping' | 'inactive' {
  if (!lastAt) return 'inactive';
  const days = (now.getTime() - lastAt.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 3) return 'active';
  if (days <= 7) return 'slipping';
  return 'inactive';
}

import { desc, gte } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  dailyCheckIns,
  eveningReflections,
  holisticCompletions,
  intakeResponses,
  llmUsage,
  plans,
  reinforcementResponses,
  users,
} from '@/db/schema';

export type AnalyticsRange = {
  days: number;
  since: Date;
};

export function parseAnalyticsRange(daysParam: string | null): AnalyticsRange {
  const days = Math.min(Math.max(Number(daysParam) || 30, 7), 90);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  return { days, since };
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildDateSeries(since: Date, days: number): string[] {
  const out: string[] = [];
  const cursor = new Date(since);
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  while (cursor <= end && out.length < days + 1) {
    out.push(dateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function sumCost(rows: { costUsd: string | null }[]): number {
  return rows.reduce((n, r) => n + (r.costUsd ? Number(r.costUsd) : 0), 0);
}

export async function collectAdminAnalytics(range: AnalyticsRange) {
  const db = getDb();
  const { since, days } = range;
  const dateSeries = buildDateSeries(since, days);

  const allUsers = (await db
    .select({ id: users.id, role: users.role, createdAt: users.createdAt })
    .from(users)) as { id: string; role: string; createdAt: Date }[];
  const clients = allUsers.filter((u: { role: string }) => u.role === 'client');
  const signupsByDay = new Map<string, number>();
  for (const u of allUsers) {
    const key = dateKey(u.createdAt);
    if (key >= dateKey(since)) {
      signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
    }
  }

  const intakes = await db
    .select({ id: intakeResponses.id, userId: intakeResponses.userId, completedAt: intakeResponses.completedAt })
    .from(intakeResponses);
  const allPlans = (await db
    .select({ id: plans.id, userId: plans.userId, status: plans.status, approvedAt: plans.approvedAt })
    .from(plans)) as { id: string; userId: string; status: string; approvedAt: Date | null }[];

  const approvedPlans = allPlans.filter((p: { status: string }) => p.status === 'approved');
  const activeClientIds = new Set<string>();

  const checkIns = (await db
    .select({ clientId: dailyCheckIns.clientId, dateIso: dailyCheckIns.dateIso })
    .from(dailyCheckIns)
    .where(gte(dailyCheckIns.submittedAt, since))) as { clientId: string; dateIso: string }[];

  const reflections = await db
    .select({ clientId: eveningReflections.clientId, dateIso: eveningReflections.dateIso })
    .from(eveningReflections)
    .where(gte(eveningReflections.submittedAt, since));

  const holistic = await db
    .select({ clientId: holisticCompletions.clientId, dateIso: holisticCompletions.dateIso })
    .from(holisticCompletions)
    .where(gte(holisticCompletions.completedAt, since));

  const readOuts = await db
    .select({ clientId: reinforcementResponses.clientId, submittedAt: reinforcementResponses.submittedAt })
    .from(reinforcementResponses)
    .where(gte(reinforcementResponses.submittedAt, since));

  const activeByDay = new Map<string, Set<string>>();
  const markActive = (clientId: string, day: string) => {
    if (day < dateKey(since)) return;
    activeClientIds.add(clientId);
    if (!activeByDay.has(day)) activeByDay.set(day, new Set());
    activeByDay.get(day)!.add(clientId);
  };

  for (const row of checkIns) markActive(row.clientId, row.dateIso);
  for (const row of reflections) markActive(row.clientId, row.dateIso);
  for (const row of holistic) markActive(row.clientId, row.dateIso);
  for (const row of readOuts) markActive(row.clientId, dateKey(row.submittedAt));

  const signupsSeries = dateSeries.map((d) => ({ date: d, count: signupsByDay.get(d) ?? 0 }));
  const activeSeries = dateSeries.map((d) => ({
    date: d,
    count: activeByDay.get(d)?.size ?? 0,
  }));

  const last7 = dateSeries.slice(-7);
  const dau = activeSeries.length > 0 ? activeSeries[activeSeries.length - 1]?.count ?? 0 : 0;
  const wau = new Set<string>();
  for (const d of last7) {
    for (const id of activeByDay.get(d) ?? []) wau.add(id);
  }

  const funnel = {
    clients: clients.length,
    intakes: intakes.length,
    plans: allPlans.length,
    approvedPlans: approvedPlans.length,
    activeInRange: activeClientIds.size,
  };

  const retentionByWeek: { week: number; clientsWithCheckIn: number }[] = [];
  for (let week = 1; week <= 6; week++) {
    const weekClients = new Set(
      checkIns
        .filter((c: { clientId: string; dateIso: string }) => {
          const plan = approvedPlans.find((p: { userId: string }) => p.userId === c.clientId);
          if (!plan?.approvedAt) return false;
          const daysSince = Math.floor(
            (new Date(c.dateIso).getTime() - plan.approvedAt.getTime()) / (24 * 60 * 60 * 1000),
          );
          const clientWeek = Math.floor(daysSince / 7) + 1;
          return clientWeek === week;
        })
        .map((c: { clientId: string }) => c.clientId),
    );
    retentionByWeek.push({ week, clientsWithCheckIn: weekClients.size });
  }

  const llmRows = (await db
    .select()
    .from(llmUsage)
    .where(gte(llmUsage.createdAt, since))
    .orderBy(desc(llmUsage.createdAt))) as {
    id: string;
    createdAt: Date;
    operation: string;
    model: string;
    userId: string | null;
    weekNumber: number | null;
    costUsd: string | null;
    status: string;
    latencyMs: number | null;
    totalTokens: number | null;
  }[];

  const costByDay = new Map<string, number>();
  const costByOperation = new Map<string, number>();
  const costByModel = new Map<string, number>();
  let totalTokens = 0;

  for (const row of llmRows) {
    const cost = row.costUsd ? Number(row.costUsd) : 0;
    const day = dateKey(row.createdAt);
    costByDay.set(day, (costByDay.get(day) ?? 0) + cost);
    costByOperation.set(row.operation, (costByOperation.get(row.operation) ?? 0) + cost);
    costByModel.set(row.model, (costByModel.get(row.model) ?? 0) + cost);
    totalTokens += row.totalTokens ?? 0;
  }

  const costSeries = dateSeries.map((d) => ({
    date: d,
    costUsd: Math.round((costByDay.get(d) ?? 0) * 10000) / 10000,
  }));

  const topCostClients = new Map<string, number>();
  for (const row of llmRows) {
    if (!row.userId) continue;
    const cost = row.costUsd ? Number(row.costUsd) : 0;
    topCostClients.set(row.userId, (topCostClients.get(row.userId) ?? 0) + cost);
  }

  const topClients = [...topCostClients.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, costUsd]) => {
      const profile = allUsers.find((u: { id: string }) => u.id === userId);
      return {
        userId,
        label: profile ? `Client ${userId.slice(0, 8)}` : userId,
        costUsd: Math.round(costUsd * 10000) / 10000,
      };
    });

  const totalCostUsd = sumCost(llmRows);
  const last30Cost = totalCostUsd;

  return {
    range: { days, since: since.toISOString() },
    signups: signupsSeries,
    activeUsers: activeSeries,
    dau,
    wau: wau.size,
    funnel,
    retentionByWeek,
    llm: {
      totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
      totalCalls: llmRows.length,
      successCalls: llmRows.filter((r: { status: string }) => r.status === 'success').length,
      errorCalls: llmRows.filter((r: { status: string }) => r.status === 'error').length,
      totalTokens,
      costByDay: costSeries,
      costByOperation: [...costByOperation.entries()].map(([operation, costUsd]) => ({
        operation,
        costUsd: Math.round(costUsd * 10000) / 10000,
      })),
      costByModel: [...costByModel.entries()].map(([model, costUsd]) => ({
        model,
        costUsd: Math.round(costUsd * 10000) / 10000,
      })),
      topClients,
      recentCalls: llmRows.slice(0, 20).map((r: (typeof llmRows)[number]) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        operation: r.operation,
        model: r.model,
        userId: r.userId,
        weekNumber: r.weekNumber,
        costUsd: r.costUsd ? Number(r.costUsd) : null,
        status: r.status,
        latencyMs: r.latencyMs,
      })),
    },
    summary: {
      llmSpend30d: Math.round(last30Cost * 10000) / 10000,
      activeUsers7d: wau.size,
    },
    timestamp: new Date().toISOString(),
  };
}

export async function collectCostSummary(days = 30) {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = (await db
    .select()
    .from(llmUsage)
    .where(gte(llmUsage.createdAt, since))) as { costUsd: string | null }[];

  return {
    totalCostUsd: Math.round(sumCost(rows) * 10000) / 10000,
    totalCalls: rows.length,
    days,
  };
}

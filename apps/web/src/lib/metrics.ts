import { desc, eq, gte } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  clientCounselor,
  dailyCheckIns,
  eveningReflections,
  holisticCompletions,
  intakeResponses,
  llmUsage,
  messages,
  plans,
  reinforcementResponses,
  users,
} from '@/db/schema';

export async function collectPlatformMetrics() {
  const db = getDb();

  const allUsers = await db.select({ id: users.id, role: users.role }).from(users);
  const totalUsers = allUsers.length;
  const totalClients = allUsers.filter((u: { role: string }) => u.role === 'client').length;

  const allIntakes = await db.select({ id: intakeResponses.id }).from(intakeResponses);
  const totalIntakes = allIntakes.length;

  const allPlans = await db.select({ id: plans.id, status: plans.status }).from(plans);
  const totalPlans = allPlans.length;
  const approvedPlans = allPlans.filter((p: { status: string }) => p.status === 'approved').length;

  const redFlagRows = await db
    .select({ id: intakeResponses.id })
    .from(intakeResponses)
    .where(eq(intakeResponses.hasRedFlags, true));
  const unsafeRows = await db
    .select({ id: intakeResponses.id })
    .from(intakeResponses)
    .where(eq(intakeResponses.isSafe, false));

  const allMessages = await db.select({ id: messages.id }).from(messages);
  const assignments = await db.select({ clientId: clientCounselor.clientId }).from(clientCounselor);

  const recentIntakes = await db
    .select({ id: intakeResponses.id, completedAt: intakeResponses.completedAt })
    .from(intakeResponses)
    .orderBy(desc(intakeResponses.completedAt))
    .limit(5);

  const recentMessages = await db
    .select({ id: messages.id, createdAt: messages.createdAt, fromUserId: messages.fromUserId })
    .from(messages)
    .orderBy(desc(messages.createdAt))
    .limit(10);

  const pendingPlans = allPlans.filter((p: { status: string }) => p.status !== 'approved').length;

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const llmRows = await db
    .select({ costUsd: llmUsage.costUsd })
    .from(llmUsage)
    .where(gte(llmUsage.createdAt, since30));
  const llmSpend30d = llmRows.reduce((n: number, r: { costUsd: string | null }) => n + (r.costUsd ? Number(r.costUsd) : 0), 0);

  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const activeIds = new Set<string>();
  const checkInRows = await db
    .select({ clientId: dailyCheckIns.clientId })
    .from(dailyCheckIns)
    .where(gte(dailyCheckIns.submittedAt, since7));
  for (const r of checkInRows) activeIds.add(r.clientId);
  const reflectionRows = await db
    .select({ clientId: eveningReflections.clientId })
    .from(eveningReflections)
    .where(gte(eveningReflections.submittedAt, since7));
  for (const r of reflectionRows) activeIds.add(r.clientId);
  const holisticRows = await db
    .select({ clientId: holisticCompletions.clientId })
    .from(holisticCompletions)
    .where(gte(holisticCompletions.completedAt, since7));
  for (const r of holisticRows) activeIds.add(r.clientId);
  const readOutRows = await db
    .select({ clientId: reinforcementResponses.clientId })
    .from(reinforcementResponses)
    .where(gte(reinforcementResponses.submittedAt, since7));
  for (const r of readOutRows) activeIds.add(r.clientId);

  return {
    summary: {
      totalUsers,
      totalClients,
      totalCounselors: totalUsers - totalClients,
      totalIntakes,
      intakeCompletionRate: totalClients > 0 ? ((totalIntakes / totalClients) * 100).toFixed(1) : '0',
      totalPlans,
      approvedPlans,
      pendingPlans,
      planApprovalRate: totalPlans > 0 ? ((approvedPlans / totalPlans) * 100).toFixed(1) : '0',
      clientCounselorAssignments: assignments.length,
      totalMessages: allMessages.length,
    },
    safety: {
      redFlags: redFlagRows.length,
      unsafeUsers: unsafeRows.length,
    },
    recentActivity: {
      intakes: recentIntakes.length,
      messages: recentMessages.length,
    },
    observability: {
      llmSpend30d: Math.round(llmSpend30d * 10000) / 10000,
      activeUsers7d: activeIds.size,
    },
    timestamp: new Date().toISOString(),
  };
}

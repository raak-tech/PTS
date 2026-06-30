import { desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { clientCounselor, intakeResponses, messages, plans, users } from '@/db/schema';

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
    timestamp: new Date().toISOString(),
  };
}

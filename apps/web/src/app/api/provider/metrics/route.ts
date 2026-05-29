import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { users, intakeResponses, plans, messages, clientCounselor } from '@/db/schema';
import { getUserFromCookieHeader } from '@/lib/session';
import { logError } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const user = await getUserFromCookieHeader(request.headers.get('cookie'));
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Get all metrics
    const [totalUsers] = await db
      .select({ count: users.id })
      .from(users)
      .then((rows: any[]) => [{ count: rows.length }]);

    const [totalClients] = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.role, 'client'))
      .then((rows: any[]) => [{ count: rows.length }]);

    const [totalIntakes] = await db
      .select({ count: intakeResponses.id })
      .from(intakeResponses)
      .then((rows: any[]) => [{ count: rows.length }]);

    const [totalPlans] = await db
      .select({ count: plans.id })
      .from(plans)
      .then((rows: any[]) => [{ count: rows.length }]);

    const [approvedPlans] = await db
      .select({ count: plans.id })
      .from(plans)
      .where(eq(plans.status, 'approved'))
      .then((rows: any[]) => [{ count: rows.length }]);

    const [redFlags] = await db
      .select({ count: intakeResponses.id })
      .from(intakeResponses)
      .where(eq(intakeResponses.hasRedFlags, true))
      .then((rows: any[]) => [{ count: rows.length }]);

    const [unsafeUsers] = await db
      .select({ count: intakeResponses.id })
      .from(intakeResponses)
      .where(eq(intakeResponses.isSafe, false))
      .then((rows: any[]) => [{ count: rows.length }]);

    const [totalMessages] = await db
      .select({ count: messages.id })
      .from(messages)
      .then((rows: any[]) => [{ count: rows.length }]);

    const [assignments] = await db
      .select({ count: clientCounselor.clientId })
      .from(clientCounselor)
      .then((rows: any[]) => [{ count: rows.length }]);

    // Recent activity
    const recentIntakes = await db
      .select({ id: intakeResponses.id, completedAt: intakeResponses.completedAt })
      .from(intakeResponses)
      .orderBy((t: any) => [t.completedAt])
      .limit(5);

    const recentMessages = await db
      .select({ id: messages.id, createdAt: messages.createdAt, fromUserId: messages.fromUserId })
      .from(messages)
      .orderBy((t: any) => [t.createdAt])
      .limit(10);

    return NextResponse.json({
      summary: {
        totalUsers: totalUsers.count,
        totalClients: totalClients.count,
        totalCounselors: totalUsers.count - totalClients.count,
        totalIntakes: totalIntakes.count,
        intakeCompletionRate: totalClients.count > 0 ? ((totalIntakes.count / totalClients.count) * 100).toFixed(1) : '0',
        totalPlans: totalPlans.count,
        approvedPlans: approvedPlans.count,
        pendingPlans: totalPlans.count - approvedPlans.count,
        planApprovalRate: totalPlans.count > 0 ? ((approvedPlans.count / totalPlans.count) * 100).toFixed(1) : '0',
        clientCounselorAssignments: assignments.count,
        totalMessages: totalMessages.count,
      },
      safety: {
        redFlags: redFlags.count,
        unsafeUsers: unsafeUsers.count,
      },
      recentActivity: {
        intakes: recentIntakes.length,
        messages: recentMessages.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logError('metrics_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

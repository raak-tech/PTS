import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { intakeResponses, messages, planWeeks, plans, users } from '@/db/schema';
import { getClientCounselorMap, isClientVisibleToProvider } from '@/lib/client-access';
import { logError } from '@/lib/logger';
import { describePendingPlanWeeks } from '@/lib/provider-console-access';
import { getUserFromRequest } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';

function displayLabel(user: { displayName: string | null; phone: string | null; email: string }) {
  if (user.displayName) return user.displayName;
  if (user.phone) return user.phone.replace('+91', '+91 ');
  const [local, domain] = user.email.split('@');
  return domain === 'phone.pts.local' ? `+${local.replace(/^91/, '91 ')}` : user.email;
}

type DraftPlanRow = {
  id: string;
  userId: string;
  status: string;
  counselorNotes: string | null;
  createdAt: Date;
  generatedContent: string;
};

type UserLabelRow = {
  id: string;
  displayName: string | null;
  phone: string | null;
  email: string;
};

type IntakeSummaryRow = {
  userId: string;
  painSource: string;
  painDescription: string;
  recoveryGoal: string;
  hasRedFlags: boolean;
  isSafe: boolean;
};

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const assignmentMap = await getClientCounselorMap();
    const isVisible = (clientId: string) =>
      isClientVisibleToProvider(clientId, user.id, assignmentMap);

    const draftPlans = (await db
      .select({
        id: plans.id,
        userId: plans.userId,
        status: plans.status,
        counselorNotes: plans.counselorNotes,
        createdAt: plans.createdAt,
        generatedContent: plans.generatedContent,
      })
      .from(plans)
      .where(eq(plans.status, 'draft'))
      .orderBy(plans.createdAt)) as DraftPlanRow[];
    const visibleDraftPlans = draftPlans.filter((plan) => isVisible(plan.userId));

    const clientIds: string[] = [...new Set(visibleDraftPlans.map((p) => p.userId))];
    const clientUsers: UserLabelRow[] =
      clientIds.length > 0
        ? ((await db
            .select({
              id: users.id,
              displayName: users.displayName,
              phone: users.phone,
              email: users.email,
            })
            .from(users)
            .where(inArray(users.id, clientIds))) as UserLabelRow[])
        : [];

    const intakes: IntakeSummaryRow[] =
      clientIds.length > 0
        ? ((await db
            .select({
              userId: intakeResponses.userId,
              painSource: intakeResponses.painSource,
              painDescription: intakeResponses.painDescription,
              recoveryGoal: intakeResponses.recoveryGoal,
              hasRedFlags: intakeResponses.hasRedFlags,
              isSafe: intakeResponses.isSafe,
            })
            .from(intakeResponses)
            .where(inArray(intakeResponses.userId, clientIds))) as IntakeSummaryRow[])
        : [];

    const userById = Object.fromEntries(clientUsers.map((u) => [u.id, u]));
    const intakeByUserId = Object.fromEntries(intakes.map((i) => [i.userId, i]));

    const planIds = visibleDraftPlans.map((plan) => plan.id);
    const weekRows =
      planIds.length > 0
        ? ((await db
            .select({
              planId: planWeeks.planId,
              weekNumber: planWeeks.weekNumber,
              status: planWeeks.status,
            })
            .from(planWeeks)
            .where(inArray(planWeeks.planId, planIds))) as {
            planId: string;
            weekNumber: number;
            status: string;
          }[])
        : [];

    const weeksByPlan: Record<string, { weekNumber: number; status: string }[]> = {};
    for (const row of weekRows) {
      if (!weeksByPlan[row.planId]) weeksByPlan[row.planId] = [];
      weeksByPlan[row.planId].push({ weekNumber: row.weekNumber, status: row.status });
    }

    const unreadRows = await db
      .select({ fromUserId: messages.fromUserId })
      .from(messages)
      .where(and(eq(messages.toUserId, user.id), isNull(messages.readAt)));

    const unreadByClient: Record<string, number> = {};
    for (const row of unreadRows) {
      if (row.fromUserId === user.id) continue;
      unreadByClient[row.fromUserId] = (unreadByClient[row.fromUserId] ?? 0) + 1;
    }

    const allClients = (await db
      .select({
        id: users.id,
        displayName: users.displayName,
        phone: users.phone,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, 'client'))
      .orderBy(desc(users.createdAt))) as (UserLabelRow & { createdAt: Date })[];
    const visibleClients = allClients.filter((client) => isVisible(client.id));

    const allPlans = (await db
      .select({ userId: plans.userId, status: plans.status })
      .from(plans)) as { userId: string; status: string }[];

    const planStatusByUser = Object.fromEntries(allPlans.map((p) => [p.userId, p.status]));

    const redFlagCount = await db
      .select({ id: intakeResponses.id })
      .from(intakeResponses)
      .where(eq(intakeResponses.hasRedFlags, true));

    return NextResponse.json({
      ok: true,
      pendingPlans: visibleDraftPlans.map((plan) => ({
        id: plan.id,
        clientId: plan.userId,
        clientName: displayLabel(userById[plan.userId] ?? { displayName: null, phone: null, email: 'unknown@unknown.com' }),
        createdAt: plan.createdAt.toISOString(),
        counselorNotes: plan.counselorNotes,
        pendingWeeksLabel: describePendingPlanWeeks(plan.status, weeksByPlan[plan.id] ?? []),
        intake: intakeByUserId[plan.userId] ?? null,
        generatedContent: plan.generatedContent,
      })),
      unreadMessages: Object.entries(unreadByClient)
        .filter(([clientId]) => isVisible(clientId))
        .map(([clientId, count]) => ({
        clientId,
        clientName: displayLabel(
          visibleClients.find((c) => c.id === clientId) ?? { displayName: null, phone: null, email: 'unknown@unknown.com' },
        ),
        count,
      })),
      clients: visibleClients.map((client) => ({
        id: client.id,
        name: displayLabel(client),
        planStatus: planStatusByUser[client.id] ?? 'none',
        hasRedFlag: Boolean(intakeByUserId[client.id]?.hasRedFlags),
        unreadCount: unreadByClient[client.id] ?? 0,
      })),
      redFlags: redFlagCount.length,
    });
  } catch (err) {
    logError('provider_queue_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

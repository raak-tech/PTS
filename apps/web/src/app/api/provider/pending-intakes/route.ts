import { desc, eq, inArray, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { intakeResponses, plans, users } from '@/db/schema';
import { getClientCounselorMap, isClientVisibleToProvider } from '@/lib/client-access';
import { logError } from '@/lib/logger';
import { formatClientContact } from '@/lib/pii';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Query pending intakes: clients with intakeResponse but no plan
    type PendingIntakeRow = {
      userId: string;
      painSource: string;
      hasRedFlags: boolean;
      isSafe: boolean;
      createdAt: Date;
    };

    const pendingIntakes = (await db
      .select({
        userId: intakeResponses.userId,
        painSource: intakeResponses.painSource,
        hasRedFlags: intakeResponses.hasRedFlags,
        isSafe: intakeResponses.isSafe,
        createdAt: intakeResponses.createdAt,
      })
      .from(intakeResponses)
      .leftJoin(plans, eq(intakeResponses.userId, plans.userId))
      .where(isNull(plans.id))
      .orderBy(desc(intakeResponses.createdAt))) as PendingIntakeRow[];

    const assignmentMap = await getClientCounselorMap();
    const visibleIntakes = pendingIntakes.filter((intake) =>
      isClientVisibleToProvider(intake.userId, user.id, assignmentMap),
    );

    // Fetch user details for display
    const userIds = visibleIntakes.map(p => p.userId);
    type UserRow = { id: string; email: string; phone: string | null; displayName: string | null };
    const clientUsers: UserRow[] =
      userIds.length > 0
        ? ((await db
            .select({
              id: users.id,
              email: users.email,
              phone: users.phone,
              displayName: users.displayName,
            })
            .from(users)
            .where(inArray(users.id, userIds))) as UserRow[])
        : [];

    const userById = Object.fromEntries(clientUsers.map((u) => [u.id, u]));

    // Format for mobile display
    const formatted = visibleIntakes.map((intake) => {
      const client = userById[intake.userId] ?? {
        email: 'unknown@unknown.com',
        phone: null,
        displayName: null,
      };
      return {
        userId: intake.userId,
        anonEmail: formatClientContact(client),
        clientPhone: client.phone,
        clientEmail: client.email,
        painSource: intake.painSource,
        submittedAt: intake.createdAt.toISOString(),
        hasRedFlags: intake.hasRedFlags,
        isSafe: intake.isSafe,
      };
    });

    return NextResponse.json({
      ok: true,
      pendingIntakes: formatted,
    });
  } catch (err) {
    logError('provider_pending_intakes_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}


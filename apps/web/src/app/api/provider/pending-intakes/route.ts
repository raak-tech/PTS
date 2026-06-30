import { desc, eq, inArray, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { intakeResponses, plans, users } from '@/db/schema';
import { logError } from '@/lib/logger';
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

    // Fetch user details for display
    const userIds = pendingIntakes.map(p => p.userId);
    type UserRow = { id: string; email: string };
    const clientUsers: UserRow[] =
      userIds.length > 0
        ? ((await db
            .select({
              id: users.id,
              email: users.email,
            })
            .from(users)
            .where(inArray(users.id, userIds))) as UserRow[])
        : [];

    const emailById = Object.fromEntries(clientUsers.map(u => [u.id, u.email]));

    // Format for mobile display
    const formatted = pendingIntakes.map(intake => ({
      userId: intake.userId,
      anonEmail: formatAnonEmail(emailById[intake.userId] ?? 'unknown@unknown.com'),
      painSource: intake.painSource,
      submittedAt: intake.createdAt.toISOString(),
      hasRedFlags: intake.hasRedFlags,
      isSafe: intake.isSafe,
    }));

    return NextResponse.json({
      ok: true,
      pendingIntakes: formatted,
    });
  } catch (err) {
    logError('provider_pending_intakes_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

function formatAnonEmail(email: string) {
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}

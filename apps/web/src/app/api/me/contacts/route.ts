import { and, eq, inArray, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { clientCounselor, counselorProfiles, messages, plans, users } from '@/db/schema';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type UserLabelRow = {
  id: string;
  displayName: string | null;
  phone: string | null;
  email: string;
};

function displayLabel(user: { displayName: string | null; phone: string | null; email: string }) {
  if (user.displayName) return user.displayName;
  if (user.phone) return user.phone.replace('+91', '+91 ');
  const [local, domain] = user.email.split('@');
  return domain === 'phone.pts.local' ? `+${local.replace(/^91/, '91 ')}` : user.email;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const db = getDb();

    if (user.role === 'client') {
      const [assignment] = await db
        .select({ counselorId: clientCounselor.counselorId })
        .from(clientCounselor)
        .where(eq(clientCounselor.clientId, user.id))
        .limit(1);

      if (!assignment?.counselorId) {
        return NextResponse.json({ ok: true, counselor: null });
      }

      const [counselor] = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          phone: users.phone,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, assignment.counselorId))
        .limit(1);

      if (!counselor) {
        return NextResponse.json({ ok: true, counselor: null });
      }

      let calendlyUrl: string | null = null;
      try {
        const [profile] = await db
          .select({ calendlyUrl: counselorProfiles.calendlyUrl })
          .from(counselorProfiles)
          .where(eq(counselorProfiles.userId, counselor.id))
          .limit(1);
        calendlyUrl = profile?.calendlyUrl ?? null;
      } catch (profileErr) {
        logError('me_contacts_profile_error', profileErr, { counselorId: counselor.id });
      }

      let unreadCount = 0;
      try {
        const unread = await db
          .select({ id: messages.id })
          .from(messages)
          .where(
            and(
              eq(messages.toUserId, user.id),
              eq(messages.fromUserId, counselor.id),
              isNull(messages.readAt),
            ),
          );
        unreadCount = unread.length;
      } catch (unreadErr) {
        logError('me_contacts_unread_error', unreadErr, { clientId: user.id, counselorId: counselor.id });
      }

      return NextResponse.json({
        ok: true,
        counselor: {
          id: counselor.id,
          name: displayLabel(counselor),
          unreadCount,
          calendlyUrl,
        },
      });
    }

    const assignments = (await db
      .select({ clientId: clientCounselor.clientId })
      .from(clientCounselor)
      .where(eq(clientCounselor.counselorId, user.id))) as { clientId: string }[];

    const assignedIds: string[] = assignments.map((a) => a.clientId);
    const clients: UserLabelRow[] =
      assignedIds.length > 0
        ? ((await db
            .select({
              id: users.id,
              displayName: users.displayName,
              phone: users.phone,
              email: users.email,
            })
            .from(users)
            .where(and(eq(users.role, 'client'), inArray(users.id, assignedIds)))) as UserLabelRow[])
        : [];

    const unreadRows = await db
      .select({ fromUserId: messages.fromUserId })
      .from(messages)
      .where(and(eq(messages.toUserId, user.id), isNull(messages.readAt)));

    const unreadByClient: Record<string, number> = {};
    for (const row of unreadRows) {
      unreadByClient[row.fromUserId] = (unreadByClient[row.fromUserId] ?? 0) + 1;
    }

    const planRows = (await db.select({ userId: plans.userId, status: plans.status }).from(plans)) as {
      userId: string;
      status: string;
    }[];
    const planStatusByUser = Object.fromEntries(planRows.map((p) => [p.userId, p.status]));

    return NextResponse.json({
      ok: true,
      clients: clients.map((client) => ({
        id: client.id,
        name: displayLabel(client),
        planStatus: planStatusByUser[client.id] ?? 'none',
        unreadCount: unreadByClient[client.id] ?? 0,
      })),
    });
  } catch (err) {
    logError('me_contacts_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import {
  clientCounselor,
  dailyCalendarEntries,
  dailyReinforcements,
  holisticCompletions,
  reinforcementResponses,
  users,
} from '@/db/schema';
import { isDateInRange, localDateIso, parseCalendarBlocks } from '@/lib/daily-layer';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

function displayLabel(user: { displayName: string | null; phone: string | null; email: string }) {
  if (user.displayName) return user.displayName;
  if (user.phone) return user.phone.replace('+91', '+91 ');
  return user.email;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const db = getDb();
    const today = localDateIso();

    const assignments = (await db
      .select({ clientId: clientCounselor.clientId })
      .from(clientCounselor)
      .where(eq(clientCounselor.counselorId, user.id))) as { clientId: string }[];

    const clientIds = assignments.map((a) => a.clientId);
    if (clientIds.length === 0) {
      return NextResponse.json({ ok: true, clients: [] });
    }

    type UserLabelRow = {
      id: string;
      displayName: string | null;
      phone: string | null;
      email: string;
    };

    const clientUsers = (await db
      .select({
        id: users.id,
        displayName: users.displayName,
        phone: users.phone,
        email: users.email,
      })
      .from(users)) as UserLabelRow[];

    const clients = await Promise.all(
      clientIds.map(async (clientId) => {
        const profile = clientUsers.find((u) => u.id === clientId);
        const reinforcements = (await db
          .select()
          .from(dailyReinforcements)
          .where(eq(dailyReinforcements.clientId, clientId))
          .orderBy(desc(dailyReinforcements.createdAt))) as {
          id: string;
          title: string;
          startDate: string;
          endDate: string;
        }[];

        const active = reinforcements.find((r) => isDateInRange(today, r.startDate, r.endDate));
        let reinforcementRecordedToday = false;
        if (active) {
          const responses = (await db
            .select()
            .from(reinforcementResponses)
            .where(eq(reinforcementResponses.reinforcementId, active.id))) as {
            submittedAt: Date;
          }[];
          reinforcementRecordedToday = responses.some((r) => localDateIso(r.submittedAt) === today);
        }

        const [calendar] = (await db
          .select()
          .from(dailyCalendarEntries)
          .where(
            and(
              eq(dailyCalendarEntries.clientId, clientId),
              eq(dailyCalendarEntries.dateIso, today),
            ),
          )
          .limit(1)) as { blocks: string }[];

        const blocks = calendar ? parseCalendarBlocks(calendar.blocks) : [];
        const doneCount = blocks.filter((b) => b.status === 'done').length;

        const holisticRows = (await db
          .select()
          .from(holisticCompletions)
          .where(
            and(
              eq(holisticCompletions.clientId, clientId),
              eq(holisticCompletions.dateIso, today),
            ),
          )) as { activityType: string }[];

        const holisticDone = holisticRows.length;
        const holisticTotal = 3;

        return {
          clientId,
          name: profile ? displayLabel(profile) : 'Client',
          reinforcementTitle: active?.title ?? null,
          reinforcementRecordedToday,
          calendarBlocksTotal: blocks.length,
          calendarBlocksDone: doneCount,
          holisticDone,
          holisticTotal,
          needsAttention: Boolean(
            (active && !reinforcementRecordedToday) || holisticDone < 2,
          ),
        };
      }),
    );

    return NextResponse.json({
      ok: true,
      date: today,
      clients: clients.sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention)),
    });
  } catch (err) {
    logError('provider_engagement_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

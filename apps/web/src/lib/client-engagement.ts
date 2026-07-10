import { and, desc, eq, gte } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  dailyCalendarEntries,
  dailyCheckIns,
  dailyReinforcements,
  holisticCompletions,
  reinforcementResponses,
  supportArtifacts,
  users,
} from '@/db/schema';
import { isDateInRange, localDateIso, parseCalendarBlocks } from '@/lib/daily-layer';
import { formatClientLabel } from '@/lib/provider-display';

export type ClientEngagementRow = {
  clientId: string;
  name: string;
  phone: string | null;
  reinforcementTitle: string | null;
  reinforcementCount: number;
  reinforcementPendingCount: number;
  reinforcementRecordedToday: boolean;
  calendarBlocksTotal: number;
  calendarBlocksDone: number;
  holisticDone: number;
  holisticTotal: number;
  checkInDone: boolean;
  assignedTaskCount: number;
  completedTaskCount: number;
  completionPct: number;
  needsAttention: boolean;
  recentClientShareCount: number;
  hasRecentClientShare: boolean;
  painLevels: { dateIso: string; painLevel: number }[];
};

type UserLabelRow = {
  id: string;
  displayName: string | null;
  phone: string | null;
  email: string;
};

export async function buildEngagementForClients(
  clientIds: string[],
  today = localDateIso(),
): Promise<ClientEngagementRow[]> {
  if (clientIds.length === 0) return [];

  const db = getDb();
  const clientUsers = (await db
    .select({
      id: users.id,
      displayName: users.displayName,
      phone: users.phone,
      email: users.email,
    })
    .from(users)) as UserLabelRow[];

  const profileById = Object.fromEntries(clientUsers.map((u) => [u.id, u]));

  const shareWindowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return Promise.all(
    clientIds.map(async (clientId) => {
      const profile = profileById[clientId];

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

      const activeRows = reinforcements.filter((r) => isDateInRange(today, r.startDate, r.endDate));
      let reinforcementRecordedToday = false;
      let reinforcementPendingCount = 0;
      if (activeRows.length > 0) {
        const responseChecks = await Promise.all(
          activeRows.map(async (row) => {
            const responses = (await db
              .select()
              .from(reinforcementResponses)
              .where(eq(reinforcementResponses.reinforcementId, row.id))) as { submittedAt: Date }[];
            return responses.some((r) => localDateIso(r.submittedAt) === today);
          }),
        );
        reinforcementPendingCount = responseChecks.filter((done) => !done).length;
        reinforcementRecordedToday = reinforcementPendingCount === 0;
      }

      const [calendar] = (await db
        .select()
        .from(dailyCalendarEntries)
        .where(and(eq(dailyCalendarEntries.clientId, clientId), eq(dailyCalendarEntries.dateIso, today)))
        .limit(1)) as { blocks: string }[];

      const blocks = calendar ? parseCalendarBlocks(calendar.blocks) : [];
      const calendarBlocksDone = blocks.filter((b) => b.status === 'done').length;
      const calendarBlocksTotal = blocks.length;

      const holisticRows = (await db
        .select()
        .from(holisticCompletions)
        .where(and(eq(holisticCompletions.clientId, clientId), eq(holisticCompletions.dateIso, today)))) as {
        activityType: string;
      }[];

      const holisticDone = holisticRows.length;
      const holisticTotal = 4;

      const [checkIn] = await db
        .select({ id: dailyCheckIns.id })
        .from(dailyCheckIns)
        .where(and(eq(dailyCheckIns.clientId, clientId), eq(dailyCheckIns.dateIso, today)))
        .limit(1);

      const checkInDone = Boolean(checkIn);

      const recentShares = (await db
        .select({ id: supportArtifacts.id })
        .from(supportArtifacts)
        .where(
          and(
            eq(supportArtifacts.userId, clientId),
            eq(supportArtifacts.kind, 'counselor-share'),
            gte(supportArtifacts.createdAt, shareWindowStart),
          ),
        )) as { id: string }[];
      const recentClientShareCount = recentShares.length;

      const painRows = (await db
        .select({ dateIso: dailyCheckIns.dateIso, painLevel: dailyCheckIns.painLevel })
        .from(dailyCheckIns)
        .where(eq(dailyCheckIns.clientId, clientId))
        .orderBy(desc(dailyCheckIns.dateIso))
        .limit(7)) as { dateIso: string; painLevel: number }[];
      const painLevels = [...painRows].reverse();

      let assignedTaskCount = 0;
      let completedTaskCount = 0;

      if (activeRows.length > 0) {
        assignedTaskCount += activeRows.length;
        completedTaskCount += activeRows.length - reinforcementPendingCount;
      }
      if (holisticTotal > 0) {
        assignedTaskCount += holisticTotal;
        completedTaskCount += holisticDone;
      }
      assignedTaskCount += 1; // morning check-in
      if (checkInDone) completedTaskCount += 1;
      if (calendarBlocksTotal > 0) {
        assignedTaskCount += calendarBlocksTotal;
        completedTaskCount += calendarBlocksDone;
      }

      const completionPct =
        assignedTaskCount > 0 ? Math.round((completedTaskCount / assignedTaskCount) * 100) : 0;

      return {
        clientId,
        name: profile ? formatClientLabel(profile) : 'Client',
        phone: profile?.phone ?? null,
        reinforcementTitle:
          activeRows.length > 1 ? `${activeRows.length} read-outs` : activeRows[0]?.title ?? null,
        reinforcementCount: activeRows.length,
        reinforcementPendingCount,
        reinforcementRecordedToday,
        calendarBlocksTotal,
        calendarBlocksDone,
        holisticDone,
        holisticTotal,
        checkInDone,
        assignedTaskCount,
        completedTaskCount,
        completionPct,
        needsAttention: assignedTaskCount > 0 && completionPct < 50,
        recentClientShareCount,
        hasRecentClientShare: recentClientShareCount > 0,
        painLevels,
      };
    }),
  );
}

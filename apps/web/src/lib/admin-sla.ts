import { and, desc, eq, isNull, lt } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  clientCounselor,
  counselorNotes,
  intakeResponses,
  messages,
  plans,
  users,
} from '@/db/schema';

const SLA_MS = 12 * 60 * 60 * 1000;

export type SlaBreach = {
  kind: 'unanswered_message' | 'pending_intake' | 'urgent_note';
  clientId: string;
  clientLabel: string;
  counselorId?: string;
  counselorLabel?: string;
  ageHours: number;
  detail: string;
  createdAt: string;
};

function hoursSince(date: Date): number {
  return Math.round((Date.now() - date.getTime()) / (60 * 60 * 1000));
}

export async function collectSlaBreaches(): Promise<SlaBreach[]> {
  const db = getDb();
  const cutoff = new Date(Date.now() - SLA_MS);
  const breaches: SlaBreach[] = [];

  const clientUsers = await db
    .select({ id: users.id, email: users.email, displayName: users.displayName })
    .from(users)
    .where(eq(users.role, 'client'));
  const clientLabel = (id: string) => {
    const u = clientUsers.find((c: { id: string }) => c.id === id);
    if (!u) return 'Client';
    return u.displayName?.trim() || u.email.split('@')[0];
  };

  const counselors = await db
    .select({ id: users.id, email: users.email, displayName: users.displayName })
    .from(users)
    .where(eq(users.role, 'provider'));
  const counselorLabel = (id: string) => {
    const u = counselors.find((c: { id: string }) => c.id === id);
    if (!u) return 'Counselor';
    return u.displayName?.trim() || u.email.split('@')[0];
  };

  const assignments = await db
    .select({ clientId: clientCounselor.clientId, counselorId: clientCounselor.counselorId })
    .from(clientCounselor);
  const counselorByClient = Object.fromEntries(
    assignments.map((a: { clientId: string; counselorId: string }) => [a.clientId, a.counselorId]),
  );

  // Unanswered client messages to counselor > 12h
  const inbound = await db
    .select({
      id: messages.id,
      fromUserId: messages.fromUserId,
      toUserId: messages.toUserId,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(and(lt(messages.createdAt, cutoff), isNull(messages.readAt)))
    .orderBy(messages.createdAt);

  for (const msg of inbound) {
    const [fromUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, msg.fromUserId))
      .limit(1);
    if (fromUser?.role !== 'client') continue;

    const counselorId = counselorByClient[msg.fromUserId] ?? msg.toUserId;
    breaches.push({
      kind: 'unanswered_message',
      clientId: msg.fromUserId,
      clientLabel: clientLabel(msg.fromUserId),
      counselorId,
      counselorLabel: counselorLabel(counselorId),
      ageHours: hoursSince(msg.createdAt),
      detail: msg.body.slice(0, 120),
      createdAt: msg.createdAt.toISOString(),
    });
  }

  // Pending intakes with no plan > 12h
  const pendingIntakes = await db
    .select({
      userId: intakeResponses.userId,
      createdAt: intakeResponses.createdAt,
      planId: plans.id,
    })
    .from(intakeResponses)
    .leftJoin(plans, eq(intakeResponses.userId, plans.userId))
    .where(isNull(plans.id));

  for (const row of pendingIntakes) {
    if (row.createdAt >= cutoff) continue;
    breaches.push({
      kind: 'pending_intake',
      clientId: row.userId,
      clientLabel: clientLabel(row.userId),
      ageHours: hoursSince(row.createdAt),
      detail: 'Intake submitted, no plan generated yet',
      createdAt: row.createdAt.toISOString(),
    });
  }

  // Unresolved urgent admin notes > 12h
  const urgentNotes = await db
    .select({
      id: counselorNotes.id,
      clientId: counselorNotes.clientId,
      body: counselorNotes.body,
      createdAt: counselorNotes.createdAt,
    })
    .from(counselorNotes)
    .where(
      and(
        eq(counselorNotes.isUrgent, true),
        isNull(counselorNotes.resolvedAt),
        lt(counselorNotes.createdAt, cutoff),
      ),
    );

  for (const note of urgentNotes) {
    const counselorId = counselorByClient[note.clientId];
    breaches.push({
      kind: 'urgent_note',
      clientId: note.clientId,
      clientLabel: clientLabel(note.clientId),
      counselorId,
      counselorLabel: counselorId ? counselorLabel(counselorId) : undefined,
      ageHours: hoursSince(note.createdAt),
      detail: note.body.slice(0, 120),
      createdAt: note.createdAt.toISOString(),
    });
  }

  return breaches.sort((a, b) => b.ageHours - a.ageHours);
}

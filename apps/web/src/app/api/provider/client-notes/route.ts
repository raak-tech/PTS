import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { clientCounselor, counselorNotes, users } from '@/db/schema';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type AssignmentRow = { clientId: string };
type NoteRow = {
  id: string;
  clientId: string;
  authorId: string;
  body: string;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
};
type ClientLabelRow = { id: string; displayName: string | null; phone: string | null; email: string };

function displayLabel(user: { displayName: string | null; phone: string | null; email: string }) {
  if (user.displayName) return user.displayName;
  if (user.phone) return user.phone.replace('+91', '+91 ');
  const [local, domain] = user.email.split('@');
  return domain === 'phone.pts.local' ? `+${local.replace(/^91/, '91 ')}` : user.email;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const db = getDb();

    const assignments = (await db
      .select({ clientId: clientCounselor.clientId })
      .from(clientCounselor)
      .where(eq(clientCounselor.counselorId, user.id))) as AssignmentRow[];

    const clientIds = assignments.map((a: AssignmentRow) => a.clientId);
    if (clientIds.length === 0) {
      return NextResponse.json({ ok: true, notes: [] });
    }

    const notes = (await db
      .select()
      .from(counselorNotes)
      .where(and(inArray(counselorNotes.clientId, clientIds), isNull(counselorNotes.resolvedAt)))
      .orderBy(desc(counselorNotes.createdAt))) as NoteRow[];

    const clientUsers = (await db
      .select({ id: users.id, displayName: users.displayName, phone: users.phone, email: users.email })
      .from(users)
      .where(inArray(users.id, clientIds))) as ClientLabelRow[];

    const clientById = Object.fromEntries(clientUsers.map((c: ClientLabelRow) => [c.id, c]));

    return NextResponse.json({
      ok: true,
      notes: notes.map((n: NoteRow) => ({
        id: n.id,
        clientId: n.clientId,
        clientName: displayLabel(
          clientById[n.clientId] ?? { displayName: null, phone: null, email: 'unknown@unknown.com' },
        ),
        body: n.body,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    logError('provider_client_notes_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

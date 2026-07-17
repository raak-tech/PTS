import { and, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { clientCounselor, counselorNotes, users } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';

type AssignmentRow = { clientId: string };
type NoteRow = {
  id: string;
  clientId: string;
  authorId: string;
  body: string;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  createdAt: Date;
};
type ClientLabelRow = { id: string; displayName: string | null; phone: string | null; email: string };

function displayLabel(user: { displayName: string | null; phone: string | null; email: string }) {
  if (user.displayName) return user.displayName;
  if (user.phone) return user.phone.replace('+91', '+91 ');
  const [local, domain] = user.email.split('@');
  return domain === 'phone.pts.local' ? `+${local.replace(/^91/, '91 ')}` : user.email;
}

function mapNote(n: NoteRow, clientById: Record<string, ClientLabelRow>) {
  return {
    id: n.id,
    clientId: n.clientId,
    clientName: displayLabel(
      clientById[n.clientId] ?? { displayName: null, phone: null, email: 'unknown@unknown.com' },
    ),
    body: n.body,
    createdAt: n.createdAt.toISOString(),
    resolvedAt: n.resolvedAt ? n.resolvedAt.toISOString() : null,
    resolutionNote: n.resolutionNote ?? null,
  };
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const url = new URL(request.url);
    const includeResolved = url.searchParams.get('includeResolved') === '1';

    let clientIds: string[] = [];
    if (isAdminUser(user)) {
      const allClients = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'client'));
      clientIds = allClients.map((c) => c.id);
    } else {
      const assignments = (await db
        .select({ clientId: clientCounselor.clientId })
        .from(clientCounselor)
        .where(eq(clientCounselor.counselorId, user.id))) as AssignmentRow[];
      clientIds = assignments.map((a) => a.clientId);
    }

    if (clientIds.length === 0) {
      return NextResponse.json({ ok: true, notes: [], resolvedNotes: [] });
    }

    const openNotes = (await db
      .select()
      .from(counselorNotes)
      .where(and(inArray(counselorNotes.clientId, clientIds), isNull(counselorNotes.resolvedAt)))
      .orderBy(desc(counselorNotes.createdAt))) as NoteRow[];

    let resolvedNotes: NoteRow[] = [];
    if (includeResolved) {
      resolvedNotes = (await db
        .select()
        .from(counselorNotes)
        .where(and(inArray(counselorNotes.clientId, clientIds), isNotNull(counselorNotes.resolvedAt)))
        .orderBy(desc(counselorNotes.resolvedAt))
        .limit(25)) as NoteRow[];
    }

    const labelIds = [...new Set([...openNotes, ...resolvedNotes].map((n) => n.clientId))];
    const clientUsers =
      labelIds.length > 0
        ? ((await db
            .select({
              id: users.id,
              displayName: users.displayName,
              phone: users.phone,
              email: users.email,
            })
            .from(users)
            .where(inArray(users.id, labelIds))) as ClientLabelRow[])
        : [];

    const clientById = Object.fromEntries(clientUsers.map((c) => [c.id, c]));

    return NextResponse.json({
      ok: true,
      notes: openNotes.map((n) => mapNote(n, clientById)),
      resolvedNotes: resolvedNotes.map((n) => mapNote(n, clientById)),
    });
  } catch (err) {
    logError('provider_client_notes_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

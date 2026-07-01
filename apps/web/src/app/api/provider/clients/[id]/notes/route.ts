import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { counselorNotes } from '@/db/schema';
import { assertCounselorForClient } from '@/lib/client-access';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type RouteContext = { params: Promise<{ id: string }> };
type NoteRow = {
  id: string;
  clientId: string;
  authorId: string;
  body: string;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!(await assertCounselorForClient(user.id, id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const db = getDb();

    const notes = (await db
      .select()
      .from(counselorNotes)
      .where(eq(counselorNotes.clientId, id))
      .orderBy(desc(counselorNotes.createdAt))) as NoteRow[];

    return NextResponse.json({
      ok: true,
      notes: notes.map((n: NoteRow) => ({
        id: n.id,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
        resolvedAt: n.resolvedAt ? n.resolvedAt.toISOString() : null,
      })),
    });
  } catch (err) {
    logError('provider_client_notes_scoped_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

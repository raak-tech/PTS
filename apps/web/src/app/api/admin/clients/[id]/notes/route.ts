import { randomUUID } from 'node:crypto';

import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { counselorNotes, users } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { recordAudit } from '@/lib/audit';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const db = getDb();

    const notes = await db
      .select()
      .from(counselorNotes)
      .where(eq(counselorNotes.clientId, id))
      .orderBy(desc(counselorNotes.createdAt));

    return NextResponse.json({ ok: true, notes });
  } catch (err) {
    logError('admin_client_notes_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();

    const [client] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!client) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const now = new Date();
    const note = {
      id: randomUUID(),
      clientId: id,
      authorId: user!.id,
      body: parsed.data.text,
      resolvedAt: null,
      resolvedBy: null,
      resolutionNote: null,
      createdAt: now,
    };

    await db.insert(counselorNotes).values(note);

    void recordAudit({
      actorUserId: user!.id,
      actorRole: user!.role,
      action: 'admin_note',
      targetType: 'client',
      targetId: id,
      metadata: { noteId: note.id },
    });

    return NextResponse.json({ ok: true, note });
  } catch (err) {
    logError('admin_client_notes_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

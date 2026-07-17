import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { counselorNotes } from '@/db/schema';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { recordAudit } from '@/lib/audit';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';

type RouteContext = { params: Promise<{ id: string; noteId: string }> };

const bodySchema = z.object({
  resolutionNote: z.string().trim().min(3).max(2000),
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { id, noteId } = await context.params;

    if (!(await assertProviderCanAccessClient(user.id, id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'invalid',
          reason: 'resolution_note_required',
          detail: 'Add a short note describing how you addressed this before marking it done.',
        },
        { status: 400 },
      );
    }

    const db = getDb();

    const [updated] = await db
      .update(counselorNotes)
      .set({
        resolvedAt: new Date(),
        resolvedBy: user.id,
        resolutionNote: parsed.data.resolutionNote,
      })
      .where(and(eq(counselorNotes.id, noteId), eq(counselorNotes.clientId, id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    void recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'resolve_note',
      targetType: 'counselor_note',
      targetId: noteId,
      metadata: {
        clientId: id,
        resolutionNoteLength: parsed.data.resolutionNote.length,
      },
    });

    return NextResponse.json({
      ok: true,
      note: {
        id: updated.id,
        body: updated.body,
        resolutionNote: updated.resolutionNote,
        resolvedAt: updated.resolvedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (err) {
    logError('provider_client_note_resolve_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

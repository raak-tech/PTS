import { randomUUID } from 'node:crypto';

import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '../../../../db';
import { supportArtifacts, userConsents } from '../../../../db/schema';
import { localDateIso } from '../../../../lib/daily-layer';
import { logError } from '../../../../lib/logger';
import { getUserFromRequest } from '../../../../lib/session';

const artifactSchema = z.object({
  kind: z.enum(['intake', 'plan', 'daily', 'check-in', 'counselor-share']),
  title: z.string().trim().min(1).max(120),
  bodyText: z.string().trim().min(1).max(5000),
  reflectionCiphertext: z.string().trim().min(1).max(12000).optional(),
  reflectionEncryptionMeta: z.string().trim().min(1).max(12000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

function dailyNoteTitle(dateIso: string) {
  return `Daily notes · ${dateIso}`;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const dateIso = searchParams.get('date') ?? localDateIso();
    const kind = searchParams.get('kind') ?? 'daily';

    const db = getDb();
    const rows: {
      id: string;
      title: string;
      bodyText: string;
      createdAt: Date;
    }[] = await db
      .select({
        id: supportArtifacts.id,
        title: supportArtifacts.title,
        bodyText: supportArtifacts.bodyText,
        createdAt: supportArtifacts.createdAt,
      })
      .from(supportArtifacts)
      .where(and(eq(supportArtifacts.userId, user.id), eq(supportArtifacts.kind, kind)))
      .orderBy(desc(supportArtifacts.createdAt));

    const titleMatch = dailyNoteTitle(dateIso);
    const artifact =
      rows.find((r) => r.title === titleMatch) ??
      rows.find((r) => localDateIso(r.createdAt) === dateIso) ??
      null;

    return NextResponse.json({
      ok: true,
      artifact: artifact
        ? { id: artifact.id, title: artifact.title, bodyText: artifact.bodyText }
        : null,
    });
  } catch (err) {
    logError('artifacts_get_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const parsed = artifactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const db = getDb();
    const [consent] = await db.select().from(userConsents).where(eq(userConsents.userId, user.id)).limit(1);

    if (!consent?.dataStorageEnabled) {
      return NextResponse.json({ error: 'consent-required' }, { status: 403 });
    }

    const now = new Date();
    const dateIso = parsed.data.date ?? localDateIso();
    const shareTitles: Record<string, string> = {
      update: "What's changed",
      question: 'Questions for counselor',
      win: 'Wins to share',
    };
    const title =
      parsed.data.kind === 'daily'
        ? dailyNoteTitle(dateIso)
        : parsed.data.kind === 'counselor-share'
          ? (shareTitles[parsed.data.title] ?? parsed.data.title)
          : parsed.data.title;

    if (parsed.data.kind === 'daily') {
      const [existing] = await db
        .select({ id: supportArtifacts.id })
        .from(supportArtifacts)
        .where(
          and(
            eq(supportArtifacts.userId, user.id),
            eq(supportArtifacts.kind, 'daily'),
            eq(supportArtifacts.title, title),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(supportArtifacts)
          .set({ bodyText: parsed.data.bodyText, createdAt: now })
          .where(eq(supportArtifacts.id, existing.id));
        return NextResponse.json({ ok: true, id: existing.id });
      }
    }

    const id = randomUUID();
    await db.insert(supportArtifacts).values({
      id,
      userId: user.id,
      kind: parsed.data.kind,
      title,
      bodyText: parsed.data.bodyText,
      reflectionCiphertext: parsed.data.reflectionCiphertext ?? null,
      reflectionEncryptionMeta: parsed.data.reflectionEncryptionMeta ?? null,
      createdAt: now,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    logError('artifacts_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

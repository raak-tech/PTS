import { createHash, randomUUID } from 'node:crypto';

import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeSessions, llmUsage } from '@/db/schema';
import type { ExtractionResult } from '@/lib/intake-extractor';
import { log } from '@/lib/logger';

const EXTRACT_RATE_LIMIT = 20;
const EXTRACT_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

type CacheEntry = {
  expiresAt: number;
  payload: ExtractionResult & { clientSummary?: string; extractionUsable?: boolean };
};

const memoryCache = new Map<string, CacheEntry>();

export function hashIntakeText(text: string): string {
  return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

export async function assertIntakeExtractRateLimit(userId: string): Promise<{
  ok: boolean;
  clientMessage?: string;
}> {
  const db = getDb();
  const since = new Date(Date.now() - EXTRACT_RATE_WINDOW_MS);
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(llmUsage)
    .where(
      and(
        eq(llmUsage.userId, userId),
        eq(llmUsage.operation, 'intake_extraction'),
        gte(llmUsage.createdAt, since),
      ),
    );
  const count = rows[0]?.n ?? 0;
  if (count >= EXTRACT_RATE_LIMIT) {
    return {
      ok: false,
      clientMessage:
        'You have reached the intake attempt limit for now. Please wait a bit and try again, or continue from where you left off.',
    };
  }
  return { ok: true };
}

export async function getCachedIntakeExtraction(
  userId: string,
  freeText: string,
): Promise<ExtractionResult | null> {
  const key = `${userId}:${hashIntakeText(freeText)}`;
  const mem = memoryCache.get(key);
  if (mem && mem.expiresAt > Date.now()) {
    log('intake_extract_cache_hit', { source: 'memory', userId });
    return mem.payload;
  }

  const db = getDb();
  const rows = await db
    .select({
      extractionJson: intakeSessions.extractionJson,
      summary: intakeSessions.summary,
      overallConfidence: intakeSessions.overallConfidence,
      rounds: intakeSessions.rounds,
    })
    .from(intakeSessions)
    .where(and(eq(intakeSessions.userId, userId), eq(intakeSessions.rawText, freeText)))
    .orderBy(desc(intakeSessions.updatedAt))
    .limit(1);

  const row = rows[0];
  if (!row?.extractionJson) return null;

  try {
    const extracted = JSON.parse(row.extractionJson) as ExtractionResult['extracted'];
    const result: ExtractionResult = {
      extracted,
      requiredFieldsMet: true,
      missingRequired: [],
      lowConfidenceRequired: [],
      followUpQuestions: [],
      summary: row.summary ?? '',
      overallConfidence: Number(row.overallConfidence ?? 0) || 0,
    };
    memoryCache.set(key, { expiresAt: Date.now() + 30 * 60 * 1000, payload: result });
    log('intake_extract_cache_hit', { source: 'db', userId });
    return result;
  } catch {
    return null;
  }
}

export function putMemoryIntakeExtractionCache(
  userId: string,
  freeText: string,
  result: ExtractionResult,
): void {
  const key = `${userId}:${hashIntakeText(freeText)}`;
  memoryCache.set(key, {
    expiresAt: Date.now() + 30 * 60 * 1000,
    payload: result,
  });
}

/** Persist a draft session so identical retries can skip the LLM. */
export async function persistIntakeExtractionDraft(opts: {
  userId: string;
  segmentType: string;
  freeText: string;
  round: number;
  result: ExtractionResult;
}): Promise<void> {
  const db = getDb();
  const now = new Date();
  const confidenceScores: Record<string, number> = {};
  for (const [field, entry] of Object.entries(opts.result.extracted)) {
    if (entry && typeof entry === 'object' && 'confidence' in entry) {
      confidenceScores[field] = Number((entry as { confidence: number }).confidence) || 0;
    }
  }

  try {
    const existing = await db
      .select({ id: intakeSessions.id })
      .from(intakeSessions)
      .where(and(eq(intakeSessions.userId, opts.userId), eq(intakeSessions.rawText, opts.freeText)))
      .orderBy(desc(intakeSessions.updatedAt))
      .limit(1);

    if (existing[0]) {
      await db
        .update(intakeSessions)
        .set({
          extractionJson: JSON.stringify(opts.result.extracted),
          confidenceScores: JSON.stringify(confidenceScores),
          rounds: opts.round,
          overallConfidence: String(opts.result.overallConfidence),
          summary: opts.result.summary,
          updatedAt: now,
        })
        .where(eq(intakeSessions.id, existing[0].id));
      return;
    }

    await db.insert(intakeSessions).values({
      id: randomUUID(),
      userId: opts.userId,
      intakeResponseId: null,
      segmentType: opts.segmentType,
      rawText: opts.freeText,
      extractionJson: JSON.stringify(opts.result.extracted),
      confidenceScores: JSON.stringify(confidenceScores),
      rounds: opts.round,
      overallConfidence: String(opts.result.overallConfidence),
      summary: opts.result.summary,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    log('intake_extract_draft_persist_failed', {
      userId: opts.userId,
      detail: err instanceof Error ? err.message : 'unknown',
    });
  }
}

import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDb } from '@/db';
import { intakeResponses, intakeSessions } from '@/db/schema';
import { mapExtractionToIntake, type IntakeInsertShape } from '@/lib/intake-mappers';
import type { ExtractedIntake } from '@/lib/intake-extractor';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

export const maxDuration = 120;

const extractionFieldSchema = z.object({
  value: z.union([z.string(), z.boolean(), z.null()]),
  confidence: z.number().min(0).max(1),
});

const bodySchema = z.object({
  extracted: z.record(z.string(), extractionFieldSchema),
  mapped: z.record(z.string(), z.any()).optional().default({}),
  segmentType: z.string().nullable().optional(),
  rounds: z.number().int().min(1).max(3),
  overallConfidence: z.number().min(0).max(1),
  summary: z.string(),
  rawText: z.string().optional().default(''),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 },
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid', detail: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { extracted, mapped, segmentType, rounds, overallConfidence, summary, rawText } =
      parsed.data;

    const now = new Date();
    const db = getDb();

    // 1. Map extraction to intakeResponses DB shape and upsert
    const intakeShape = mapExtractionToIntake(extracted as unknown as ExtractedIntake);

    const intakeId = randomUUID();
    const intakeValues = {
      ...intakeShape,
      // Convert boolean null for hasDependents (mapExtractionToIntake returns boolean | null)
      hasDependents: intakeShape.hasDependents ?? null as boolean | null,
    };

    await db
      .insert(intakeResponses)
      .values({
        id: intakeId,
        userId: user.id,
        ...intakeValues,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: intakeResponses.userId,
        set: {
          ...intakeValues,
          completedAt: now,
          updatedAt: now,
        },
      });

    // 2. Build confidence scores map from extraction
    const confidenceScores: Record<string, number> = {};
    const extractedRecord = extracted as Record<string, { confidence: number }>;
    for (const [key, field] of Object.entries(extractedRecord)) {
      if (field && typeof field.confidence === 'number') {
        confidenceScores[key] = field.confidence;
      }
    }

    // 3. Create intakeSession record
    const sessionId = randomUUID();
    await db.insert(intakeSessions).values({
      id: sessionId,
      userId: user.id,
      intakeResponseId: intakeId,
      segmentType: segmentType ?? null,
      rawText: rawText || '',
      extractionJson: JSON.stringify(extracted),
      confidenceScores: JSON.stringify(confidenceScores),
      rounds,
      overallConfidence: String(overallConfidence),
      summary,
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      intakeSessionId: sessionId,
      intakeResponseId: intakeId,
    });
  } catch (err) {
    logError('intake_save_error', err);
    const message =
      err instanceof Error ? err.message : 'internal';
    return NextResponse.json(
      { error: 'save_failed', detail: message },
      { status: 500 },
    );
  }
}

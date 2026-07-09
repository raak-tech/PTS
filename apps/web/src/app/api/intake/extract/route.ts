import { NextResponse } from 'next/server';
import { z } from 'zod';

import { extractIntake } from '@/lib/intake-extractor';
import { mapExtractionToIntake } from '@/lib/intake-mappers';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

export const maxDuration = 120;

const bodySchema = z.object({
  segmentType: z.string().default('other'),
  freeText: z.string().min(30, 'Tell us a bit more — at least a sentence'),
  round: z.number().int().min(1).max(3),
  priorExtraction: z.string().optional(),
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

    const { segmentType, freeText, round, priorExtraction } =
      parsed.data;

    const result = await extractIntake(
      {
        segmentType,
        freeText,
        round,
        priorExtraction,
      },
      { userId: user.id },
    );

    // Map to DB shape for the client to preview what would be saved
    const mapped = mapExtractionToIntake(result.extracted);

    return NextResponse.json({
      ok: true,
      round,
      extracted: result.extracted,
      requiredFieldsMet: result.requiredFieldsMet,
      missingRequired: result.missingRequired,
      lowConfidenceRequired: result.lowConfidenceRequired,
      followUpQuestions: result.followUpQuestions,
      summary: result.summary,
      overallConfidence: result.overallConfidence,
      mapped, // DB-ready shape for the confirmation card
    });
  } catch (err) {
    logError('intake_extract_error', err);
    const message =
      err instanceof Error ? err.message : 'internal';
    return NextResponse.json(
      { error: 'extraction_failed', detail: message },
      { status: 500 },
    );
  }
}
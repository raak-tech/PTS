import { NextResponse } from 'next/server';
import { z } from 'zod';

import { computeGateStatus, extractIntake } from '@/lib/intake-extractor';
import {
  assertIntakeExtractRateLimit,
  getCachedIntakeExtraction,
  persistIntakeExtractionDraft,
  putMemoryIntakeExtractionCache,
} from '@/lib/intake-extract-gates';
import { mapExtractionToIntake } from '@/lib/intake-mappers';
import {
  assessIntakeTextQuality,
  isExtractionUsable,
  toClientSummary,
} from '@/lib/intake-quality';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

export const maxDuration = 120;

const bodySchema = z.object({
  segmentType: z.string().default('other'),
  freeText: z
    .string()
    .min(30, 'Tell us a bit more — at least a sentence')
    .max(4000, 'Please keep this under 4000 characters'),
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

    const textQuality = assessIntakeTextQuality(freeText);
    if (!textQuality.ok) {
      return NextResponse.json(
        { error: 'text_quality', detail: textQuality.clientMessage },
        { status: 422 },
      );
    }

    const cached = await getCachedIntakeExtraction(user.id, freeText);
    if (cached && !priorExtraction) {
      const gate = computeGateStatus(cached.extracted, round);
      const extractionUsable = isExtractionUsable(cached.extracted, cached.summary);
      const clientSummary = toClientSummary(cached.summary, segmentType);
      const mapped = mapExtractionToIntake(cached.extracted);
      return NextResponse.json({
        ok: true,
        round,
        cached: true,
        extracted: cached.extracted,
        requiredFieldsMet: gate.requiredFieldsMet,
        missingRequired: gate.missingRequired,
        lowConfidenceRequired: gate.lowConfidenceRequired,
        followUpQuestions: cached.followUpQuestions,
        summary: cached.summary,
        clientSummary,
        extractionUsable,
        overallConfidence: gate.overallConfidence,
        mapped,
      });
    }

    const rate = await assertIntakeExtractRateLimit(user.id);
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'rate_limited', detail: rate.clientMessage },
        { status: 429 },
      );
    }

    const result = await extractIntake(
      {
        segmentType,
        freeText,
        round,
        priorExtraction,
      },
      { userId: user.id },
    );

    putMemoryIntakeExtractionCache(user.id, freeText, result);
    void persistIntakeExtractionDraft({
      userId: user.id,
      segmentType,
      freeText,
      round,
      result,
    });

    const extractionUsable = isExtractionUsable(
      result.extracted,
      result.summary,
    );
    const clientSummary = toClientSummary(result.summary, segmentType);

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
      clientSummary,
      extractionUsable,
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

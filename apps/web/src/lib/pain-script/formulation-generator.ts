import { log, logError } from '@/lib/logger';
import {
  parseOpenRouterUsage,
  recordLlmUsage,
  type LlmUsageContext,
} from '@/lib/llm-usage';
import { modelForOperation } from '@/lib/pain-script/models';
import {
  buildFormulationUserPrompt,
  FORMULATION_SYSTEM_PROMPT,
} from '@/lib/pain-script/prompts';
import { formatProfileSnapshotForPrompt } from '@/lib/pain-script/profile-snapshot';
import type { FormulationGenerationResult, ProfileSnapshot } from '@/lib/pain-script/types';
import { normalizeFormulation } from '@/lib/pain-script/validate-formulation';

export type FormulationIntakeInput = {
  painSource: string;
  painSourceOther?: string | null;
  painDescription: string;
  painDuration: string;
  activitiesAffected: string;
  biggestChange: string;
  recoveryGoal: string;
  onsetType?: string | null;
  ageRange?: string | null;
  occupation?: string | null;
  socialSupport?: string | null;
  currentTreatment?: string | null;
};

function formatIntakeBlock(intake: FormulationIntakeInput): string {
  return [
    `- Pain source: ${intake.painSource}`,
    `- Description: ${intake.painDescription}`,
    `- Duration: ${intake.painDuration}`,
    `- Onset type: ${intake.onsetType ?? 'not specified'}`,
    `- Activities affected: ${intake.activitiesAffected}`,
    `- Biggest change: ${intake.biggestChange}`,
    `- Recovery goal: ${intake.recoveryGoal}`,
    `- Occupation: ${intake.occupation ?? 'n/a'}`,
    `- Social support: ${intake.socialSupport ?? 'n/a'}`,
    `- Treatment: ${intake.currentTreatment ?? 'n/a'}`,
  ].join('\n');
}

export async function generateFormulation(
  intake: FormulationIntakeInput,
  rawIntakeText: string | null,
  profile: ProfileSnapshot | null,
  context?: LlmUsageContext,
): Promise<FormulationGenerationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const model = modelForOperation('formulation_generation');
  log('formulation_generation_start', { userId: context?.userId });

  const userPrompt = buildFormulationUserPrompt({
    intakeBlock: formatIntakeBlock(intake),
    rawIntakeText,
    profileBlock: formatProfileSnapshotForPrompt(profile),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pts-web-pied.vercel.app',
        'X-Title': 'PTS Formulation Generator',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: FORMULATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 6000,
        usage: { include: true },
      }),
    });
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    await recordLlmUsage({
      operation: 'formulation_generation',
      model,
      context,
      status: 'error',
      latencyMs,
      errorText: err instanceof Error ? err.message : 'request_failed',
    });
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    const err = await response.text();
    await recordLlmUsage({
      operation: 'formulation_generation',
      model,
      context,
      status: 'error',
      latencyMs,
      errorText: `HTTP ${response.status}: ${err.slice(0, 500)}`,
    });
    throw new Error(`Formulation LLM error ${response.status}`);
  }

  type OpenRouterResponse = {
    id?: string;
    choices: { message: { content: string } }[];
    usage?: unknown;
  };
  const data = (await response.json()) as OpenRouterResponse;
  const usage = parseOpenRouterUsage(data.usage);
  const raw = data.choices[0]?.message?.content ?? '';
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    const parsed = normalizeFormulation(JSON.parse(cleaned));
    await recordLlmUsage({
      operation: 'formulation_generation',
      model,
      context,
      usage,
      status: 'success',
      latencyMs,
      requestId: data.id ?? null,
    });
    log('formulation_generation_complete', { userId: context?.userId, costUsd: usage?.cost });
    return parsed;
  } catch (err) {
    logError('formulation_generation_parse_error', err, { raw: cleaned.slice(0, 200) });
    await recordLlmUsage({
      operation: 'formulation_generation',
      model,
      context,
      usage,
      status: 'error',
      latencyMs,
      requestId: data.id ?? null,
      errorText: 'invalid_json',
    });
    throw new Error('Formulation generation returned invalid JSON');
  }
}

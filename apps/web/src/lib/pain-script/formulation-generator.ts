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

/** Deterministic draft so counselor can still edit/approve if LLM output is unusable. */
function fallbackFormulationFromIntake(intake: FormulationIntakeInput): FormulationGenerationResult {
  const desc = (intake.painDescription || intake.painSource || 'pain').slice(0, 200);
  return normalizeFormulation({
    scriptBeliefs: {
      self: [
        {
          statement: `I feel limited by my ${intake.painSource || 'pain'} and worry it will not improve.`,
          evidence: desc,
          tags: ['SB_SELF', 'SD_SOMATIC'],
        },
      ],
      others: [
        {
          statement: 'Others may not fully understand how much this affects me.',
          evidence: intake.socialSupport || intake.biggestChange || desc,
          tags: ['SB_OTHERS', 'BID_IP'],
        },
      ],
      life: [
        {
          statement: 'Everyday life feels harder and less reliable because of the pain.',
          evidence: intake.activitiesAffected || desc,
          tags: ['SB_LIFE', 'RE_TRIGGERS'],
        },
      ],
      needs: ['safety', 'competence', 'validation'],
      coreFeelings: ['worry', 'frustration'],
    },
    scriptDisplays: {
      behaviours: [intake.activitiesAffected || 'Activity changes due to pain'].slice(0, 1),
      somaticExperience: [desc],
      fantasies: ['Worry that pain will never ease'],
    },
    reinforcingExperiences: {
      currentTriggers: [intake.biggestChange || 'Daily limitations from pain'],
      oldMemories: [],
      catastrophicReliving: [],
    },
    basicId: {
      behaviour: { present: true, summary: intake.activitiesAffected || 'Activity impact noted.', examples: [] },
      affect: { present: true, summary: 'Emotional load from ongoing pain.', examples: [] },
      sensation: { present: true, summary: desc, examples: [] },
      imagery: { present: false, summary: 'Not enough information — counsellor to explore.', examples: [] },
      cognition: { present: true, summary: 'Thoughts tied to pain persistence and recovery goal.', examples: [] },
      interpersonal: {
        present: Boolean(intake.socialSupport),
        summary: intake.socialSupport || 'Not enough information — counsellor to explore.',
        examples: [],
      },
      drugBiological: {
        present: Boolean(intake.currentTreatment),
        summary: intake.currentTreatment || 'Not enough information — counsellor to explore.',
        examples: [],
      },
    },
    maintenanceHypothesis:
      `Draft from intake (LLM unavailable/unparseable). Pain (${intake.painSource || 'unspecified'}, ` +
      `${intake.painDuration || 'duration unknown'}) with goal "${intake.recoveryGoal || 'improve functioning'}". ` +
      'Counsellor should revise before approval.',
    primaryTargets: ['SB_SELF', 'SD_SOMATIC', 'RE_TRIGGERS'],
    confidence: { SB_SELF: 0.35, SD_SOMATIC: 0.4, RE_TRIGGERS: 0.3 },
    safetyFlag: false,
    safetyReason: null,
  });
}

function extractJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('no_json_object');
  }
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
        temperature: 0.3,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
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
    // Some models reject response_format — retry once without it.
    if (response.status === 400) {
      return generateFormulationWithoutJsonMode(intake, rawIntakeText, profile, context);
    }
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
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = normalizeFormulation(extractJsonObject(cleaned));
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
    logError('formulation_generation_parse_error', err, { raw: cleaned.slice(0, 400) });
    await recordLlmUsage({
      operation: 'formulation_generation',
      model,
      context,
      usage,
      status: 'error',
      latencyMs,
      requestId: data.id ?? null,
      errorText: 'invalid_json_fallback',
    });
    log('formulation_generation_parse_fallback', { userId: context?.userId });
    return fallbackFormulationFromIntake(intake);
  }
}

async function generateFormulationWithoutJsonMode(
  intake: FormulationIntakeInput,
  rawIntakeText: string | null,
  profile: ProfileSnapshot | null,
  context?: LlmUsageContext,
): Promise<FormulationGenerationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY!;
  const model = modelForOperation('formulation_generation');
  const userPrompt = buildFormulationUserPrompt({
    intakeBlock: formatIntakeBlock(intake),
    rawIntakeText,
    profileBlock: formatProfileSnapshotForPrompt(profile),
  });
  const startedAt = Date.now();
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
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
      temperature: 0.3,
      max_tokens: 8000,
      usage: { include: true },
    }),
  });
  const latencyMs = Date.now() - startedAt;
  if (!response.ok) {
    await recordLlmUsage({
      operation: 'formulation_generation',
      model,
      context,
      status: 'error',
      latencyMs,
      errorText: `HTTP ${response.status} (no json mode)`,
    });
    return fallbackFormulationFromIntake(intake);
  }
  const data = (await response.json()) as {
    id?: string;
    choices: { message: { content: string } }[];
    usage?: unknown;
  };
  const usage = parseOpenRouterUsage(data.usage);
  const cleaned = (data.choices[0]?.message?.content ?? '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    const parsed = normalizeFormulation(extractJsonObject(cleaned));
    await recordLlmUsage({
      operation: 'formulation_generation',
      model,
      context,
      usage,
      status: 'success',
      latencyMs,
      requestId: data.id ?? null,
    });
    return parsed;
  } catch (err) {
    logError('formulation_generation_parse_error', err, { raw: cleaned.slice(0, 400) });
    await recordLlmUsage({
      operation: 'formulation_generation',
      model,
      context,
      usage,
      status: 'error',
      latencyMs,
      requestId: data.id ?? null,
      errorText: 'invalid_json_fallback',
    });
    return fallbackFormulationFromIntake(intake);
  }
}

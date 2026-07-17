import { log, logError } from '@/lib/logger';
import {
  parseOpenRouterUsage,
  recordLlmUsage,
  type LlmUsageContext,
} from '@/lib/llm-usage';
import type { GeneratedPlan, WeekPlan } from '@/lib/holistic-plan-types';
import { modelForOperation } from '@/lib/pain-script/models';
import { buildPlanFromFormulationUserPrompt } from '@/lib/pain-script/prompts';
import {
  postProcessGeneratedPlan,
  validatePlanTags,
} from '@/lib/pain-script/plan-post-process';
import { formatProfileSnapshotForPrompt } from '@/lib/pain-script/profile-snapshot';
import type { OnsetType } from '@/lib/pain-script/modalities';
import type { PainScriptFormulation, ProfileSnapshot } from '@/lib/pain-script/types';

type PlanIntakeInput = {
  painSource: string;
  painDescription: string;
  painDuration: string;
  activitiesAffected: string;
  biggestChange: string;
  recoveryGoal: string;
  ayurvedaPreferences?: string | null;
  onsetType?: OnsetType;
};

function intakeBlock(intake: PlanIntakeInput): string {
  return [
    `Pain: ${intake.painDescription}`,
    `Goal: ${intake.recoveryGoal}`,
    `Change: ${intake.biggestChange}`,
    `Duration: ${intake.painDuration}`,
    intake.onsetType ? `Onset: ${intake.onsetType}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function generatePlanFromFormulation(
  formulation: PainScriptFormulation,
  intake: PlanIntakeInput,
  profile: ProfileSnapshot | null,
  context?: LlmUsageContext,
): Promise<GeneratedPlan & { formulationSummary: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const model = modelForOperation('plan_generation');
  log('plan_from_formulation_start', { userId: context?.userId });

  const prompt = buildPlanFromFormulationUserPrompt({
    formulationJson: JSON.stringify(formulation, null, 2),
    intakeBlock: intakeBlock(intake),
    profileBlock: formatProfileSnapshotForPrompt(profile),
    primaryTargets: formulation.primaryTargets,
    onsetType: intake.onsetType ?? null,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 270_000);
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
        'X-Title': 'PTS Plan From Formulation',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 8000,
        usage: { include: true },
      }),
    });
  } catch (err) {
    await recordLlmUsage({
      operation: 'plan_generation',
      model,
      context,
      status: 'error',
      latencyMs: Date.now() - startedAt,
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
      operation: 'plan_generation',
      model,
      context,
      status: 'error',
      latencyMs,
      errorText: err.slice(0, 500),
    });
    throw new Error(`Plan LLM error ${response.status}`);
  }

  type OpenRouterResponse = {
    id?: string;
    choices: { message: { content: string }; finish_reason?: string }[];
    usage?: unknown;
  };
  const data = (await response.json()) as OpenRouterResponse;
  const usage = parseOpenRouterUsage(data.usage);
  const raw = data.choices[0]?.message?.content ?? '';
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsePlanJson = (text: string): GeneratedPlan & { formulationSummary?: string } => {
    try {
      return JSON.parse(text) as GeneratedPlan & { formulationSummary?: string };
    } catch {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        return JSON.parse(text.slice(start, end + 1)) as GeneratedPlan & {
          formulationSummary?: string;
        };
      }
      throw new Error('no_json_object');
    }
  };

  try {
    const parsed = parsePlanJson(cleaned);
    const first = (parsed.weeks ?? [])[0];
    const week: WeekPlan = {
      week: 1,
      theme: first?.theme ?? 'Getting started',
      focus: first?.focus ?? '',
      targets: first?.targets,
      personalizationBasis: first?.personalizationBasis,
      dailyPractices: first?.dailyPractices ?? [],
      weeklyReflection: first?.weeklyReflection ?? '',
      counselorNote: first?.counselorNote ?? '',
      ayurvedaBlock: first?.ayurvedaBlock,
      yogicPractice: first?.yogicPractice,
      yogaTrial: first?.yogaTrial,
      reinforcementTemplate: first?.reinforcementTemplate,
      reinforcementTemplates: first?.reinforcementTemplates,
      musicMoment: first?.musicMoment,
    };

    let plan: GeneratedPlan & { formulationSummary: string } = {
      overview: parsed.overview,
      clientSummary: parsed.clientSummary,
      keyThemes: parsed.keyThemes ?? [],
      watchPoints: parsed.watchPoints ?? [],
      weeks: [week],
      formulationSummary: parsed.formulationSummary ?? parsed.overview,
    };

    plan = (await postProcessGeneratedPlan(plan, {
      profile,
      primaryTargets: formulation.primaryTargets,
      resolveMusic: true,
    })) as GeneratedPlan & { formulationSummary: string };

    const tagErrors = validatePlanTags(plan, formulation.primaryTargets);
    if (tagErrors.length) {
      log('plan_tag_validation_warnings', { count: tagErrors.length, sample: tagErrors[0] });
    }

    await recordLlmUsage({
      operation: 'plan_generation',
      model,
      context,
      usage,
      status: 'success',
      latencyMs,
      requestId: data.id ?? null,
    });
    return plan;
  } catch (err) {
    logError('plan_from_formulation_parse_error', err, { raw: cleaned.slice(0, 200) });
    await recordLlmUsage({
      operation: 'plan_generation',
      model,
      context,
      usage,
      status: 'error',
      latencyMs,
      errorText: 'invalid_json',
    });
    throw new Error('Plan from formulation returned invalid JSON');
  }
}

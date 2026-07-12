import { log, logError } from '@/lib/logger';
import {
  parseOpenRouterUsage,
  recordLlmUsage,
  type LlmUsageContext,
} from '@/lib/llm-usage';
import type { GeneratedPlan, WeekPlan } from '@/lib/plan-generator';
import { modelForOperation } from '@/lib/pain-script/models';
import { buildPlanFromFormulationUserPrompt } from '@/lib/pain-script/prompts';
import { formatProfileSnapshotForPrompt } from '@/lib/pain-script/profile-snapshot';
import type { PainScriptFormulation, ProfileSnapshot } from '@/lib/pain-script/types';

type PlanIntakeInput = {
  painSource: string;
  painDescription: string;
  painDuration: string;
  activitiesAffected: string;
  biggestChange: string;
  recoveryGoal: string;
  ayurvedaPreferences?: string | null;
};

function intakeBlock(intake: PlanIntakeInput): string {
  return [
    `Pain: ${intake.painDescription}`,
    `Goal: ${intake.recoveryGoal}`,
    `Change: ${intake.biggestChange}`,
    `Duration: ${intake.painDuration}`,
  ].join('\n');
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
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    type RawWeek = {
      week?: number;
      theme: string;
      focus: string;
      targets?: string[];
      personalizationBasis?: string;
      dailyPractices?: {
        title: string;
        description: string;
        duration: string;
        targets?: string[];
        mechanism?: string;
      }[];
      weeklyReflection?: string;
      counselorNote?: string;
      ayurvedaBlock?: WeekPlan['ayurvedaBlock'];
      yogaTrial?: WeekPlan['yogaTrial'];
      reinforcementTemplate?: WeekPlan['reinforcementTemplate'];
      reinforcementTemplates?: WeekPlan['reinforcementTemplates'];
      musicMoment?: WeekPlan['musicMoment'];
    };

    const parsed = JSON.parse(cleaned) as GeneratedPlan & {
      formulationSummary?: string;
      weeks?: RawWeek[];
    };

    const first = (parsed.weeks ?? [])[0];
    const week: WeekPlan = {
      week: 1,
      theme: first?.theme ?? 'Getting started',
      focus: first?.focus ?? '',
      dailyPractices: (first?.dailyPractices ?? []).map((p) => ({
        title: p.title,
        description: p.description,
        duration: p.duration,
      })),
      weeklyReflection: first?.weeklyReflection ?? '',
      counselorNote: first?.counselorNote ?? '',
      ayurvedaBlock: first?.ayurvedaBlock,
      yogaTrial: first?.yogaTrial,
      reinforcementTemplate: first?.reinforcementTemplate,
      reinforcementTemplates: first?.reinforcementTemplates,
      musicMoment: first?.musicMoment,
    };

    const plan: GeneratedPlan & { formulationSummary: string } = {
      overview: parsed.overview,
      clientSummary: parsed.clientSummary,
      keyThemes: parsed.keyThemes ?? [],
      watchPoints: parsed.watchPoints ?? [],
      weeks: [week],
      formulationSummary: parsed.formulationSummary ?? parsed.overview,
    };

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

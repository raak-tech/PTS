import { log, logError } from '@/lib/logger';
import {
  parseOpenRouterUsage,
  recordLlmUsage,
  type LlmUsageContext,
} from '@/lib/llm-usage';
import { modelForOperation } from '@/lib/pain-script/models';
import type { PainScriptFormulation } from '@/lib/pain-script/types';
import type { WeeklySummary } from '@/lib/weekly-summary';

export type FormulationRescoreResult = {
  targetDeltas: { tag: string; direction: 'improving' | 'unchanged' | 'worsening'; evidence: string }[];
  newSignals: { component: string; item: string; tags: string[] }[];
  materialChange: boolean;
  note: string;
};

const RESCORE_SYSTEM = `You are updating a client's pain-script formulation using this week's check-in data. Do not rewrite the
whole formulation. For each PRIMARY TARGET, judge the direction of change from the evidence and note any
NEW belief, display, or reinforcing experience that has clearly surfaced.

OUTPUT JSON only:
{
  "targetDeltas": [ { "tag":"SD_FANTASY", "direction":"improving|unchanged|worsening", "evidence":"..." } ],
  "newSignals":   [ { "component":"scriptDisplays.fantasies", "item":"...", "tags":["SD_FANTASY"] } ],
  "materialChange": true|false,
  "note": "one line for the counsellor"
}
Judge direction from what the client reported, not from hope. If evidence is thin, say "unchanged".`;

export async function runFormulationRescore(
  formulation: PainScriptFormulation,
  summary: WeeklySummary,
  weeklyCheckInText: string,
  context?: LlmUsageContext,
): Promise<FormulationRescoreResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = modelForOperation('formulation_rescore');
  const startedAt = Date.now();

  const userContent = `CURRENT FORMULATION:
${JSON.stringify(formulation, null, 2)}

PRIMARY TARGETS: ${formulation.primaryTargets.join(', ')}

WEEK DATA:
- Pain trend: ${summary.painTrend ?? 'unknown'}
- Check-ins: ${summary.morningCheckIns.length}
- Blocks completed/skipped: ${summary.blocksCompleted}/${summary.blocksSkipped}
- Reinforcement responses: ${summary.reinforcementResponses}
- Weekly check-in (client words): ${weeklyCheckInText}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pts-web-pied.vercel.app',
        'X-Title': 'PTS Formulation Rescore',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: RESCORE_SYSTEM },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        usage: { include: true },
      }),
    });

    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      await recordLlmUsage({
        operation: 'formulation_rescore',
        model,
        context,
        status: 'error',
        latencyMs,
        errorText: `HTTP ${response.status}`,
      });
      return null;
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
    const result = JSON.parse(cleaned) as FormulationRescoreResult;

    await recordLlmUsage({
      operation: 'formulation_rescore',
      model,
      context,
      usage,
      status: 'success',
      latencyMs,
      requestId: data.id ?? null,
    });

    log('formulation_rescore_complete', {
      userId: context?.userId,
      materialChange: result.materialChange,
    });
    return result;
  } catch (err) {
    logError('formulation_rescore_error', err, { userId: context?.userId });
    return null;
  }
}

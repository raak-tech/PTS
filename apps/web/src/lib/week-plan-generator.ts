import { log, logError } from '@/lib/logger';
import {
  buildPainScriptWeekPlanPromptSection,
  type ProtectedFormulation,
} from '@/lib/confidential/pain-script-framework';
import {
  parseOpenRouterUsage,
  recordLlmUsage,
  type LlmUsageContext,
} from '@/lib/llm-usage';
import type { WeekPlan } from '@/lib/plan-generator';
import type { WeeklySummary } from '@/lib/weekly-summary';

export type WeekPlanIntake = {
  painSource: string;
  painDescription: string;
  recoveryGoal: string;
  ayurvedaPreferences?: string | null;
};

function buildWeekPrompt(
  intake: WeekPlanIntake,
  weekNumber: number,
  summary: WeeklySummary,
  priorWeek?: WeekPlan,
  protectedFormulation?: ProtectedFormulation | null,
): string {
  const insights = summary.scheduleInsights.slice(0, 6).join('\n- ') || 'No scheduling feedback yet.';
  const prior = priorWeek
    ? `PRIOR WEEK (${priorWeek.week} — ${priorWeek.theme}):\n${priorWeek.focus}`
    : summary.priorApprovedWeek
      ? `PRIOR APPROVED WEEK (${summary.priorApprovedWeek.week} — ${summary.priorApprovedWeek.theme}):\n${summary.priorApprovedWeek.focus}`
      : 'No prior week in program.';

  const checkIns =
    summary.morningCheckIns.length > 0
      ? summary.morningCheckIns
          .map((c) => `${c.dateIso}: pain ${c.painLevel}/10, sleep ${c.sleepQuality}${c.intention ? `, intention: ${c.intention}` : ''}`)
          .join('\n- ')
      : 'No morning check-ins yet.';

  const holistic =
    summary.holisticCompletions.length > 0
      ? summary.holisticCompletions.map((h) => `${h.activityType}: ${h.count}x`).join(', ')
      : 'No holistic completions logged.';

  const readOuts =
    summary.readOutSummaries.length > 0
      ? summary.readOutSummaries.map((line) => `- ${line}`).join('\n')
      : 'No read-out responses this week.';

  const reflections =
    summary.eveningReflectionSamples.length > 0
      ? summary.eveningReflectionSamples.map((line) => `- ${line}`).join('\n')
      : 'No evening reflections.';

  const shares =
    summary.clientShares.length > 0
      ? summary.clientShares.map((line) => `- ${line}`).join('\n')
      : 'No profile shares from client.';

  const counselorComment = summary.counselorPriorWeekComment
    ? `\nCOUNSELOR COMMENT ON PRIOR WEEK:\n${summary.counselorPriorWeekComment}\n`
    : '';

  return `You are an experienced counseling program designer writing ONE week of a personalised pain recovery program.
This is counseling support — not medical or physiotherapy.

CLIENT:
- Pain source: ${intake.painSource}
- Situation: ${intake.painDescription}
- Recovery goal: ${intake.recoveryGoal}

${prior}

WEEK ${weekNumber} ENGAGEMENT DATA:
- Read-out responses: ${summary.reinforcementResponses}
- Calendar blocks completed: ${summary.blocksCompleted}
- Blocks skipped: ${summary.blocksSkipped}
- Schedule feedback entries: ${summary.scheduleFeedbackCount}
- Evening reflections submitted: ${summary.eveningReflectionCount}
- Holistic completions: ${holistic}
- Pain trend: ${summary.painTrend ?? 'not enough check-ins'}
- Morning check-ins:
- ${checkIns}
- Read-out samples:
${readOuts}
- Evening reflections:
${reflections}
- Client profile shares:
${shares}
- Client scheduling notes:
- ${insights}
${summary.latestWeeklyCheckIn ? `\nLATEST WEEKLY CHECK-IN (client words):\n${summary.latestWeeklyCheckIn}\n` : ''}${counselorComment}

${buildPainScriptWeekPlanPromptSection(protectedFormulation)}

Generate JSON for week ${weekNumber} ONLY (no markdown). Match this structure exactly:
{
  "week": ${weekNumber},
  "theme": "short theme",
  "focus": "1-2 sentences",
  "dailyPractices": [
    { "title": "...", "description": "...", "duration": "X min" }
  ],
  "weeklyReflection": "one question",
  "counselorNote": "1-2 sentences for counselor",
  "ayurvedaBlock": { "practices": ["..."], "rhythmNote": "...", "disclaimer": "..." },
  "yogaTrial": {
    "principle": "...",
    "applicability": "...",
    "microMovement": { "title": "...", "description": "...", "duration": "2-5 min" },
    "disclaimer": "..."
  },
  "reinforcementTemplate": { "title": "...", "bodyText": "..." },
  "reinforcementTemplates": [{ "title": "...", "bodyText": "..." }],
  "musicMoment": {
    "purpose": "grounding|activation|flare|reflection",
    "suggestion": "...",
    "playlist": {
      "title": "...",
      "description": "...",
      "tracks": [{ "title": "...", "artist": "...", "note": "..." }],
      "spotifySearchQuery": "..."
    }
  }
}

Adapt to engagement data (e.g. fewer evening blocks if client skipped them). Week ${weekNumber} should build on prior progress.
Return only valid JSON.`;
}

export async function generateWeekPlan(opts: {
  intake: WeekPlanIntake;
  weekNumber: number;
  summary: WeeklySummary;
  priorWeek?: WeekPlan;
  protectedFormulation?: ProtectedFormulation | null;
  context?: LlmUsageContext;
}): Promise<WeekPlan> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const model = 'anthropic/claude-sonnet-4.6';
  log('week_plan_generation_start', { weekNumber: opts.weekNumber });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  const startedAt = Date.now();
  const context: LlmUsageContext = {
    ...opts.context,
    weekNumber: opts.weekNumber,
  };

  let response: Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pts-web-pied.vercel.app',
        'X-Title': 'PTS Week Plan Generator',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: buildWeekPrompt(opts.intake, opts.weekNumber, opts.summary, opts.priorWeek, opts.protectedFormulation) }],
        temperature: 0.7,
        max_tokens: 4000,
        usage: { include: true },
      }),
    });
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    await recordLlmUsage({
      operation: 'week_generation',
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
    logError('week_plan_generation_llm_error', new Error(err));
    await recordLlmUsage({
      operation: 'week_generation',
      model,
      context,
      status: 'error',
      latencyMs,
      errorText: `HTTP ${response.status}: ${err.slice(0, 500)}`,
    });
    throw new Error(`LLM API error ${response.status}`);
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
    const week = JSON.parse(cleaned) as WeekPlan;
    week.week = opts.weekNumber;
    log('week_plan_generation_complete', { weekNumber: opts.weekNumber, costUsd: usage?.cost });
    await recordLlmUsage({
      operation: 'week_generation',
      model,
      context,
      usage,
      status: 'success',
      latencyMs,
      requestId: data.id ?? null,
    });
    return week;
  } catch {
    logError('week_plan_generation_parse_error', new Error('Invalid JSON'), { raw: cleaned.slice(0, 200) });
    await recordLlmUsage({
      operation: 'week_generation',
      model,
      context,
      usage,
      status: 'error',
      latencyMs,
      requestId: data.id ?? null,
      errorText: 'invalid_json',
    });
    throw new Error('Week plan generation returned invalid JSON');
  }
}

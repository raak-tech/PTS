import { log, logError } from '@/lib/logger';
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
): string {
  const insights = summary.scheduleInsights.slice(0, 6).join('\n- ') || 'No scheduling feedback yet.';
  const prior = priorWeek
    ? `PRIOR WEEK (${priorWeek.week} — ${priorWeek.theme}):\n${priorWeek.focus}`
    : 'No prior week in program.';

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
- Client scheduling notes:
- ${insights}
${summary.latestWeeklyCheckIn ? `\nLATEST WEEKLY CHECK-IN (client words):\n${summary.latestWeeklyCheckIn}\n` : ''}

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
}): Promise<WeekPlan> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  log('week_plan_generation_start', { weekNumber: opts.weekNumber });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

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
        model: 'anthropic/claude-sonnet-4.6',
        messages: [{ role: 'user', content: buildWeekPrompt(opts.intake, opts.weekNumber, opts.summary, opts.priorWeek) }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const err = await response.text();
    logError('week_plan_generation_llm_error', new Error(err));
    throw new Error(`LLM API error ${response.status}`);
  }

  type OpenRouterResponse = {
    choices: { message: { content: string }; finish_reason?: string }[];
  };
  const data = (await response.json()) as OpenRouterResponse;
  const raw = data.choices[0]?.message?.content ?? '';
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    const week = JSON.parse(cleaned) as WeekPlan;
    week.week = opts.weekNumber;
    log('week_plan_generation_complete', { weekNumber: opts.weekNumber });
    return week;
  } catch {
    logError('week_plan_generation_parse_error', new Error('Invalid JSON'), { raw: cleaned.slice(0, 200) });
    throw new Error('Week plan generation returned invalid JSON');
  }
}

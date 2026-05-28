import { logError, log } from './logger';

export type WeekPlan = {
  week: number;
  theme: string;
  focus: string;
  dailyPractices: { title: string; description: string; duration: string }[];
  weeklyReflection: string;
  counselorNote: string;
};

export type GeneratedPlan = {
  overview: string;
  clientSummary: string; // what the counselor understands about this person
  weeks: WeekPlan[];
  keyThemes: string[];
  watchPoints: string[]; // things the counselor should monitor
};

type IntakeData = {
  painSource: string;
  painSourceOther?: string | null;
  painDescription: string;
  painDuration: string;
  activitiesAffected: string; // JSON array string
  biggestChange: string;
  recoveryGoal: string;
  recoveryTimeline?: string | null;
  currentTreatment?: string | null;
  socialSupport?: string | null;
  structurePreference?: string | null;
  engagementTime?: string | null;
};

const PAIN_SOURCE_LABELS: Record<string, string> = {
  workplace: 'workplace injury or incident',
  accident: 'road accident or trauma',
  sports: 'sports or physical activity injury',
  general: 'health condition or gradual onset',
  other: 'other cause',
};

const DURATION_LABELS: Record<string, string> = {
  under1m: 'less than a month',
  '1to3m': '1–3 months',
  '3to6m': '3–6 months',
  '6to12m': '6 months to a year',
  over1y: 'more than a year',
};

function buildPrompt(intake: IntakeData): string {
  const source = PAIN_SOURCE_LABELS[intake.painSource] ?? intake.painSourceOther ?? 'an unspecified cause';
  const duration = DURATION_LABELS[intake.painDuration] ?? intake.painDuration;

  let activities: string[] = [];
  try { activities = JSON.parse(intake.activitiesAffected) as string[]; } catch { /* ignore */ }

  return `You are an experienced counseling program designer creating a personalised 6-week recovery support plan.
The plan uses counseling principles (acceptance-based, values-focused, practically oriented) to help someone recover their quality of life after pain from injury.
This is NOT a medical or physiotherapy plan. It is psychological and practical support.

CLIENT INTAKE SUMMARY:
- Pain source: ${source}
- Situation: ${intake.painDescription}
- Duration: ${duration}
- Activities affected: ${activities.length > 0 ? activities.join(', ') : 'not specified'}
- Biggest change: ${intake.biggestChange}
- Recovery goal: ${intake.recoveryGoal}
- Timeline expectation: ${intake.recoveryTimeline ?? 'not specified'}
- Current treatment: ${intake.currentTreatment || 'none specified'}
- Social support: ${intake.socialSupport ?? 'not specified'}
- Prefers structure: ${intake.structurePreference ?? 'not specified'}
- Best engagement time: ${intake.engagementTime ?? 'not specified'}

Generate a JSON object (only JSON, no markdown, no explanation) with this exact structure:
{
  "overview": "2-3 sentences describing this person's situation and what this program will help them do. Warm, direct, written to the client.",
  "clientSummary": "2-3 sentences for the counselor: what is most important to understand about this person, what to watch for, what the therapeutic focus should be.",
  "keyThemes": ["theme1", "theme2", "theme3"],
  "watchPoints": ["thing to monitor 1", "thing to monitor 2"],
  "weeks": [
    {
      "week": 1,
      "theme": "short theme name",
      "focus": "1-2 sentences on what this week is about and why",
      "dailyPractices": [
        { "title": "practice name", "description": "what to do and why — 2-3 sentences, practical and specific", "duration": "X min" },
        { "title": "practice name", "description": "...", "duration": "X min" },
        { "title": "practice name", "description": "...", "duration": "X min" }
      ],
      "weeklyReflection": "The weekly reflection question or prompt for the client — one focused question",
      "counselorNote": "What the counselor should look for or discuss this week — 1-2 sentences"
    }
  ]
}

Weeks 1-2: stabilisation (grounding, understanding, safe foundation)
Weeks 3-4: building (reconnecting with values, gentle re-engagement)
Weeks 5-6: consolidation (sustainable habits, preparing for continuation)

Make the daily practices specific to this person's situation and goal.
Keep language warm, non-clinical, and empowering. Avoid jargon.
Return only valid JSON.`;
}

export async function generatePlan(intake: IntakeData): Promise<GeneratedPlan> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  log('plan_generation_start', { painSource: intake.painSource });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://pts-web-pied.vercel.app',
      'X-Title': 'PTS Plan Generator',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: buildPrompt(intake) }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logError('plan_generation_llm_error', new Error(err));
    throw new Error(`LLM API error ${response.status}: ${err}`);
  }

  type OpenRouterResponse = { choices: { message: { content: string } }[] };
  const data = await response.json() as OpenRouterResponse;
  const raw = data.choices[0]?.message?.content ?? '';

  log('plan_generation_complete');

  try {
    return JSON.parse(raw) as GeneratedPlan;
  } catch {
    logError('plan_generation_parse_error', new Error('Invalid JSON from LLM'), { raw: raw.slice(0, 200) });
    throw new Error('Plan generation returned invalid JSON');
  }
}

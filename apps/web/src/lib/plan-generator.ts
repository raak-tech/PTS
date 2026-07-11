import { logError, log } from './logger';
import {
  buildPainScriptPlanPromptSection,
  formatPainScriptSignalsForPrompt,
  type PainScriptSignals,
  type ProtectedFormulation,
} from '@/lib/confidential/pain-script-framework';
import {
  parseOpenRouterUsage,
  recordLlmUsage,
  type LlmUsageContext,
} from '@/lib/llm-usage';

export type YogaTrial = {
  principle: string;
  applicability: string;
  microMovement: { title: string; description: string; duration: string };
  disclaimer: string;
};

export type MusicPlaylist = {
  title: string;
  description: string;
  tracks: { title: string; artist: string; note: string }[];
  spotifySearchQuery: string;
};

export type WeekPlan = {
  week: number;
  theme: string;
  focus: string;
  dailyPractices: { title: string; description: string; duration: string }[];
  weeklyReflection: string;
  counselorNote: string;
  ayurvedaBlock?: { practices: string[]; rhythmNote: string; disclaimer?: string };
  yogaTrial?: YogaTrial;
  reinforcementTemplate?: { title: string; bodyText: string };
  /** Counselor may assign multiple daily read-outs per week. */
  reinforcementTemplates?: { title: string; bodyText: string }[];
  musicMoment?: {
    purpose: string;
    suggestion: string;
    playlist: MusicPlaylist;
  };
};

export type GeneratedPlan = {
  overview: string;
  clientSummary: string; // what the counselor understands about this person
  weeks: WeekPlan[];
  keyThemes: string[];
  watchPoints: string[]; // things the counselor should monitor
  /** Counselor-only — RAak proprietary formulation. Never show to clients. */
  protectedFormulation?: ProtectedFormulation;
};

type IntakeData = {
  painSource: string;
  painSourceOther?: string | null;
  painDescription: string;
  painDuration: string;
  ageRange?: string | null;
  gender?: string | null;
  occupation?: string | null;
  affectsWork?: string | null;
  hasDependents?: string | null;
  priorTherapy?: string | null;
  countryRegion?: string | null;
  activitiesAffected: string;
  biggestChange: string;
  recoveryGoal: string;
  recoveryTimeline?: string | null;
  currentTreatment?: string | null;
  socialSupport?: string | null;
  structurePreference?: string | null;
  engagementTime?: string | null;
  ayurvedaPreferences?: string | null;
  painScriptSignals?: PainScriptSignals | null;
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

  let ayurvedaContext = '';
  if (intake.ayurvedaPreferences) {
    try {
      const prefs = JSON.parse(intake.ayurvedaPreferences) as Record<string, string>;
      ayurvedaContext = `
AYURVEDA-INFORMED PREFERENCES (adjunct only — not medical treatment):
- Energy pattern: ${prefs.energyPattern ?? 'not specified'}
- Openness to daily rhythm (dinacharya): ${prefs.dinacharyaOpenness ?? 'not specified'}
- Openness to breath/stillness practices: ${prefs.breathStillnessOpenness ?? 'not specified'}
- Openness to yoga principles (not physio): ${prefs.yogaOpenness ?? 'not specified'}
- Movement vs stillness preference: ${prefs.movementPreference ?? 'not specified'}`;
    } catch {
      /* ignore */
    }
  }

  return `You are an experienced counseling program designer creating the **first week** of a personalised recovery support plan.
The plan uses counseling principles (acceptance-based, values-focused, practically oriented) to help someone recover their quality of life after pain from injury.
This is NOT a medical or physiotherapy plan. It is psychological and practical support.

After intake, generate **Week 1 only**. The counselor will review Week 1 with the client before later weeks are created one at a time.

CLIENT INTAKE SUMMARY:
- Age: ${intake.ageRange ?? 'not specified'}
- Gender: ${intake.gender ?? 'not specified'}
- Occupation: ${intake.occupation ?? 'not specified'}
- Pain affecting work: ${intake.affectsWork ?? 'not specified'}
- Has dependents: ${intake.hasDependents ?? 'not specified'}
- Prior therapy experience: ${intake.priorTherapy ?? 'not specified'}
- Location: ${intake.countryRegion ?? 'not specified'}

PAIN & SITUATION:
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
${ayurvedaContext}

PAIN-SCRIPT SIGNALS FROM INTAKE (if extracted — use with confidential framework below):
${formatPainScriptSignalsForPrompt(intake.painScriptSignals)}

${buildPainScriptPlanPromptSection()}

Generate a JSON object (only JSON, no markdown, no explanation) with this exact structure:
{
  "overview": "2-3 sentences describing this person's situation and what this program will help them do. Warm, direct, written to the client.",
  "clientSummary": "2-3 sentences for the counselor: what is most important to understand about this person, what to watch for, what the therapeutic focus should be.",
  "keyThemes": ["theme1", "theme2", "theme3"],
  "watchPoints": ["thing to monitor 1", "thing to monitor 2"],
  "protectedFormulation": {
    "confidentiality": "CONFIDENTIAL / PROTECTED IP — RAak Pain Script System. Counselor eyes only. Not for client distribution or model training.",
    "framework": "Pain Script System (RAak proprietary)",
    "scriptMaintenanceHypothesis": "2-4 sentences: how beliefs, displays, and reinforcing experiences may be maintaining the pain script for THIS client",
    "basicIdSnapshot": {
      "behaviour": "brief note or omit key if unknown",
      "affect": "...",
      "sensation": "...",
      "imagery": "...",
      "cognition": "...",
      "interpersonal": "...",
      "drug": "..."
    },
    "week1TherapeuticLeverage": "1-2 sentences on which cycle points Week 1 practices target"
  },
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
      "counselorNote": "What the counselor should look for or discuss this week — 1-2 sentences",
      "ayurvedaBlock": {
        "practices": ["1-2 gentle non-movement practices suited to this person"],
        "rhythmNote": "One sentence on daily rhythm that may help",
        "disclaimer": "Supportive wellness only — not medical Ayurvedic treatment. Stop if pain increases."
      },
      "yogaTrial": {
        "principle": "One yoga principle (e.g. ahimsa, breath awareness, acceptance) explained in plain language",
        "applicability": "2-3 sentences on how this principle applies to THIS person's pain situation and confidence",
        "microMovement": {
          "title": "Very small optional movement (confidence-building, not exercise prescription)",
          "description": "What to do, slowly, with stop-if-pain-increases guardrail",
          "duration": "2-5 min"
        },
        "disclaimer": "Yoga-inspired support — not physiotherapy or medical advice. Skip movement if unsure."
      },
      "reinforcementTemplate": {
        "title": "Short title for daily read-out",
        "bodyText": "2-4 sentences the client reads aloud or internalizes each morning — specific to this week's theme"
      },
      "musicMoment": {
        "purpose": "grounding | activation | flare | reflection",
        "suggestion": "1-2 sentences on how to listen and why this helps this week",
        "playlist": {
          "title": "Curated playlist title for this week",
          "description": "One sentence on the mood and intent",
          "tracks": [
            { "title": "realistic track name", "artist": "artist name", "note": "why this track fits" },
            { "title": "track 2", "artist": "artist", "note": "why" },
            { "title": "track 3", "artist": "artist", "note": "why" },
            { "title": "track 4", "artist": "artist", "note": "why" },
            { "title": "track 5", "artist": "artist", "note": "why" }
          ],
          "spotifySearchQuery": "search phrase to find similar music on Spotify"
        }
      }
    }
  ]
}

Generate **only Week 1** in the weeks array (one object). Weeks 2–6 will be created later by the counselor after reviewing client progress.
Week 1 focus: stabilisation (grounding, understanding, safe foundation).

Make the daily practices specific to this person's situation and goal.
Yoga trial is SEPARATE from dailyPractices — focus on principles and tiny confidence-building movement, not a workout plan.
Music playlist tracks should be real, well-known songs where possible (instrumental or gentle vocals for pain support).
Keep language warm, non-clinical, and empowering. Avoid jargon.
Return only valid JSON.`;
}

export async function generatePlan(
  intake: IntakeData,
  context?: LlmUsageContext,
): Promise<GeneratedPlan> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const model = 'anthropic/claude-sonnet-4.6';
  log('plan_generation_start', { painSource: intake.painSource });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 270_000);
  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pts-web-pied.vercel.app',
        'X-Title': 'PTS Plan Generator',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: buildPrompt(intake) }],
        temperature: 0.7,
        max_tokens: 8000,
        usage: { include: true },
      }),
    });
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    await recordLlmUsage({
      operation: 'plan_generation',
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
    logError('plan_generation_llm_error', new Error(err));
    await recordLlmUsage({
      operation: 'plan_generation',
      model,
      context,
      status: 'error',
      latencyMs,
      errorText: `HTTP ${response.status}: ${err.slice(0, 500)}`,
    });
    throw new Error(`LLM API error ${response.status}: ${err}`);
  }

  type OpenRouterResponse = {
    id?: string;
    choices: { message: { content: string }; finish_reason?: string }[];
    usage?: unknown;
  };
  const data = await response.json() as OpenRouterResponse;
  const usage = parseOpenRouterUsage(data.usage);
  const raw = data.choices[0]?.message?.content ?? '';
  const finishReason = data.choices[0]?.finish_reason;

  log('plan_generation_complete', {
    finishReason,
    completionTokens: usage?.completion_tokens,
    costUsd: usage?.cost,
  });

  // Strip markdown code fences if the model wrapped the JSON
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    const plan = JSON.parse(cleaned) as GeneratedPlan;
    plan.weeks = plan.weeks.slice(0, 1);
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
  } catch {
    logError('plan_generation_parse_error', new Error('Invalid JSON from LLM'), {
      finishReason,
      rawLength: cleaned.length,
      raw: cleaned.slice(0, 200),
      rawTail: cleaned.slice(-120),
    });
    await recordLlmUsage({
      operation: 'plan_generation',
      model,
      context,
      usage,
      status: 'error',
      latencyMs,
      requestId: data.id ?? null,
      errorText: finishReason === 'length' ? 'truncated_json' : 'invalid_json',
    });
    if (finishReason === 'length') {
      throw new Error('Plan generation truncated — increase max_tokens or simplify plan schema');
    }
    throw new Error('Plan generation returned invalid JSON');
  }
}

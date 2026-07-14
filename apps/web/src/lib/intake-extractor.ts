import { log, logError } from './logger';
import {
  parseOpenRouterUsage,
  recordLlmUsage,
  type LlmUsageContext,
} from './llm-usage';

// ── Types ──────────────────────────────────────────────────────

export type ExtractionField = {
  value: string | boolean | null;
  confidence: number; // 0-1
};

export type ExtractedIntake = {
  painSource: ExtractionField;
  painSourceOther: ExtractionField;
  painDescription: ExtractionField;
  painDuration: ExtractionField;
  activitiesAffected: ExtractionField; // stored as JSON string
  biggestChange: ExtractionField;
  recoveryGoal: ExtractionField;
  recoveryTimeline: ExtractionField;
  ageRange: ExtractionField;
  gender: ExtractionField;
  occupation: ExtractionField;
  affectsWork: ExtractionField;
  hasDependents: ExtractionField;
  priorTherapy: ExtractionField;
  countryRegion: ExtractionField;
  currentTreatment: ExtractionField;
  socialSupport: ExtractionField;
  structurePreference: ExtractionField;
  engagementTime: ExtractionField;
  ayurvedaPreferences: ExtractionField;
  /** sudden | gradual | mixed — drives Stage 2 modality set for pain-script path */
  onsetType: ExtractionField;
  hasRedFlags: ExtractionField;
  isSafe: ExtractionField;
  /** Optional pain-script / BASIC I.D. signals — counselor formulation only. Value is JSON object or null. */
  painScriptSignals: ExtractionField;
};

export type ExtractionResult = {
  extracted: ExtractedIntake;
  requiredFieldsMet: boolean;
  missingRequired: string[];
  lowConfidenceRequired: string[];
  followUpQuestions: string[];
  summary: string;
  overallConfidence: number;
};

export type ExtractionInput = {
  segmentType: string;
  freeText: string;
  round: number; // 1-3
  priorExtraction?: string; // JSON of previous ExtractedIntake for context
};

// ── Required fields (must have confidence ≥ 0.85) ─────────────

const REQUIRED_FIELDS = [
  'painSource',
  'painDescription',
  'activitiesAffected',
  'biggestChange',
  'recoveryGoal',
  'hasRedFlags',
  'isSafe',
] as const;

const REQUIRED_CONFIDENCE = 0.85;

// ── Segment profiles ──────────────────────────────────────────

const SEGMENT_PROFILES: Record<string, { label: string; context: string }> = {
  pain: {
    label: 'pain',
    context:
      'The client is seeking help with chronic or injury-related pain. Focus on pain source, duration, impact on daily life, and recovery goals. Pay special attention to activities they can no longer do and what "better" means to them.',
  },
  sleep: {
    label: 'sleep',
    context:
      'The client is seeking help with sleep issues. Focus on sleep patterns (falling asleep, staying asleep, waking up tired), duration of the problem, impact on daily functioning, and what they\'ve already tried.',
  },
  anxiety: {
    label: 'anxiety / stress',
    context:
      'The client is seeking help with anxiety or stress. Focus on triggers, physical symptoms, impact on work/relationships, coping mechanisms they\'ve tried, and what a calmer life would look like.',
  },
  injury_recovery: {
    label: 'recovery after injury',
    context:
      'The client is recovering from a specific injury. Focus on what happened, current limitations, rehabilitation progress, emotional impact, and what activities they want to return to.',
  },
  other: {
    label: 'general wellbeing',
    context:
      'The client hasn\'t specified a category. Extract whatever they share freely — pay attention to emotional tone, key challenges, and what they hope to change.',
  },
};

// ── Prompt builder ────────────────────────────────────────────

function buildExtractionPrompt(input: ExtractionInput): string {
  const profile =
    SEGMENT_PROFILES[input.segmentType] ?? SEGMENT_PROFILES['other'];

  const priorContext =
    input.priorExtraction && input.round > 1
      ? `\nPREVIOUS EXTRACTION (round ${input.round - 1}):\n${input.priorExtraction}\n`
      : '';

  return `You extract structured intake data from a client's free-text description of their situation.
This is for a counseling-led wellbeing platform. The segment is: ${profile.label}.

${profile.context}

${priorContext}
CLIENT'S WORDS (round ${input.round}):
"""
${input.freeText}
"""

Extract the following fields from the client's words. For each field:
- "value": the extracted value (string, boolean, or null if not mentioned)
- "confidence": 0.0–1.0 (how certain you are based on what the client actually said — do NOT guess)

Fields to extract:
1. painSource — one of: "workplace", "accident", "sports", "general", "other" (string)
2. painSourceOther — if painSource is "other", what the client specified (string or null)
3. painDescription — what the person is experiencing, paraphrasing their words in second person ("You feel…") or their own "I" words. NEVER write "the client" or "they". 1-3 sentences (string)
4. painDuration — one of: "under1m", "1to3m", "3to6m", "6to12m", "over1y" (string or null)
5. activitiesAffected — which daily activities are impacted, as a JSON array of strings. E.g., ["sitting at desk", "playing with kids"]. Empty array if not mentioned.
6. biggestChange — the single biggest change the client has experienced. 1-2 sentences (string)
7. recoveryGoal — what the client wants to achieve. 1-2 sentences, in their words (string)
8. recoveryTimeline — when the client expects to see results (string or null)
9. ageRange — one of: "under18", "18to24", "25to34", "35to44", "45to54", "55to64", "over65" (string or null)
10. gender — "male", "female", "nonbinary", "other" (string or null)
11. occupation — the client's job or role (string or null)
12. affectsWork — whether pain/condition affects work, one of: "yes_significantly", "yes_somewhat", "no", "not_applicable" (string or null)
13. hasDependents — whether the client has people depending on them, as a string: "yes" or "no" or null if not mentioned
14. priorTherapy — any prior therapy, counseling, or treatment they've tried (string or null)
15. countryRegion — location or region mentioned (string or null)
16. currentTreatment — any current treatment, medication, or therapy (string or null)
17. socialSupport — who supports them (family, friends, none). Be specific if mentioned (string or null)
18. structurePreference — preference for program structure, one of: "highly_structured", "moderate", "flexible" (string or null)
19. engagementTime — best time of day for engagement, one of: "morning", "afternoon", "evening", "night" (string or null)
20. ayurvedaPreferences — if the client mentions or implies preferences for Ayurvedic, holistic, or alternative approaches, extract as JSON: {"energyPattern": "...", "dinacharyaOpenness": "...", "breathStillnessOpenness": "...", "yogaOpenness": "...", "movementPreference": "..."}. Omit if not relevant to this segment.
21. onsetType — how the pain/problem started: "sudden" (injury/event overnight), "gradual" (built over weeks/months), or "mixed". null if unclear.
22. hasRedFlags — true if the client mentions self-harm, suicidal ideation, severe trauma, abuse, violence, or anything requiring immediate clinical attention. false otherwise. BE CONSERVATIVE — flag if you're unsure.
23. isSafe — false if the client's current environment is unsafe (abuse, violence, neglect). true otherwise. Default to true if no safety concern is mentioned.

24. painScriptSignals — OPTIONAL formulation signals (do not require for intake completion). If the client's words imply any of the following, extract as a JSON object in "value" (not a string). Otherwise null with confidence 0.0:
   {
     "scriptBeliefs": { "self": "...", "others": "...", "life": "...", "underlyingNeeds": ["..."], "dominantEmotions": ["..."] },
     "scriptDisplays": { "behaviours": ["guarding", "pacing", ...], "sensations": ["..."], "fantasies": ["..."] },
     "reinforcingExperiences": ["invalidation", "flare after stress", ...],
     "basicId": { "behaviour": "...", "affect": "...", "sensation": "...", "imagery": "...", "cognition": "...", "interpersonal": "...", "drug": "..." }
   }
   Only include sub-fields the client actually implied. Do NOT label this framework to the client in follow-up questions.

CRITICAL RULES:
- If a field is NOT mentioned or cannot be inferred, set value to null and confidence to 0.0 (for booleans, use false with 0.0 confidence)
- For hasRedFlags: if you see ANY hint of self-harm, suicidal thoughts, abuse, severe depression, or danger, set true with high confidence. Err on the side of safety.
- For hasDependents: convert "yes" mentions to the string "yes", "no" to "no", null if not mentioned
- For painDuration: map "a few weeks" → "under1m", "couple months" → "1to3m", "about half a year" → "6to12m", etc.
- For onsetType: map "overnight after the fall" → sudden; "crept up over months" → gradual; both event + slow buildup → mixed.
- Confidence reflects how EXPLICIT the client was — not how sure you are about your guess. If the client said "I think maybe about 3 months", confidence on duration should be ~0.5. If they said "8 months ago", confidence should be ~0.95.

ADDITIONAL OUTPUTS (beyond the field extractions):
- If required fields are missing or low confidence, generate conversational follow-up questions. These should sound like a person asking, not a form. E.g., instead of "Enter pain duration" write "How long has this been going on? Even roughly helps."
- Also ask about thin coverage cells when useful for counseling: sudden vs gradual onset; what the pain means about them / others; what tends to make a bad day worse; how they cope day to day.
- Maximum 3 questions total. Priority: required-field gaps first, then onsetType if missing, then one coverage question for thin meaning/coping/reinforcers.
- If all required fields are solid and onset is known, return empty array (or at most one light coverage question before round 3).
- Write a 1-2 sentence natural-language summary in second person ("You are…"). NEVER start with "The client".

Return ONLY valid JSON (no markdown, no explanation) with this structure:
{
  "extracted": {
    "painSource": { "value": "general", "confidence": 0.95 },
    "painSourceOther": { "value": null, "confidence": 0.0 },
    ...
  },
  "followUpQuestions": ["How long has this been going on?"],
  "summary": "Client reports lower back pain for ~8 months, affecting desk work and family time."
}`;
}

// ── Parse raw LLM response ────────────────────────────────────

function parseExtractionResponse(raw: string): {
  extracted: ExtractedIntake;
  followUpQuestions: string[];
  summary: string;
} {
  const cleaned = raw
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  const data = JSON.parse(cleaned);

  // Validate structure — ensure all expected fields exist
  const expectedFields = [
    'painSource',
    'painSourceOther',
    'painDescription',
    'painDuration',
    'activitiesAffected',
    'biggestChange',
    'recoveryGoal',
    'recoveryTimeline',
    'ageRange',
    'gender',
    'occupation',
    'affectsWork',
    'hasDependents',
    'priorTherapy',
    'countryRegion',
    'currentTreatment',
    'socialSupport',
    'structurePreference',
    'engagementTime',
    'ayurvedaPreferences',
    'onsetType',
    'hasRedFlags',
    'isSafe',
    'painScriptSignals',
  ];

  for (const field of expectedFields) {
    if (!data.extracted[field]) {
      data.extracted[field] = { value: null, confidence: 0.0 };
    }
  }

  // Normalize booleans
  data.extracted.hasRedFlags = {
    value: Boolean(data.extracted.hasRedFlags?.value ?? false),
    confidence:
      typeof data.extracted.hasRedFlags?.confidence === 'number'
        ? data.extracted.hasRedFlags.confidence
        : 0.0,
  };
  data.extracted.isSafe = {
    value: data.extracted.isSafe?.value === false ? false : true, // default true
    confidence:
      typeof data.extracted.isSafe?.confidence === 'number'
        ? data.extracted.isSafe.confidence
        : 0.0,
  };

  if (!data.extracted.painScriptSignals) {
    data.extracted.painScriptSignals = { value: null, confidence: 0.0 };
  } else if (data.extracted.painScriptSignals.value) {
    const raw = data.extracted.painScriptSignals.value;
    if (typeof raw === 'object') {
      data.extracted.painScriptSignals.value = JSON.stringify(raw);
    }
  }

  const onsetRaw = data.extracted.onsetType?.value;
  if (typeof onsetRaw === 'string') {
    const normalized = onsetRaw.trim().toLowerCase();
    data.extracted.onsetType = {
      value: ['sudden', 'gradual', 'mixed'].includes(normalized) ? normalized : null,
      confidence:
        typeof data.extracted.onsetType?.confidence === 'number'
          ? data.extracted.onsetType.confidence
          : 0,
    };
  }

  return {
    extracted: data.extracted as ExtractedIntake,
    followUpQuestions: Array.isArray(data.followUpQuestions)
      ? data.followUpQuestions.slice(0, 3)
      : [],
    summary: typeof data.summary === 'string' ? data.summary : '',
  };
}

// ── Compute gate status ───────────────────────────────────────

function computeGateStatus(
  extracted: ExtractedIntake,
  round: number,
): {
  requiredFieldsMet: boolean;
  missingRequired: string[];
  lowConfidenceRequired: string[];
  overallConfidence: number;
} {
  const missingRequired: string[] = [];
  const lowConfidenceRequired: string[] = [];
  const confidences: number[] = [];

  for (const field of REQUIRED_FIELDS) {
    const entry = extracted[field];
    if (entry.value === null || entry.value === undefined || entry.value === '') {
      missingRequired.push(field);
    } else if (entry.confidence < REQUIRED_CONFIDENCE) {
      lowConfidenceRequired.push(field);
    }
    confidences.push(entry.confidence);
  }

  const overallConfidence =
    confidences.reduce((a, b) => a + b, 0) / confidences.length;

  // After round 2 (3 counting initial), surrender to counselor
  const requiredFieldsMet =
    round >= 3
      ? true // force through — counselor will see flags
      : missingRequired.length === 0 && lowConfidenceRequired.length === 0;

  return {
    requiredFieldsMet,
    missingRequired,
    lowConfidenceRequired,
    overallConfidence: Math.round(overallConfidence * 100) / 100,
  };
}

/** Spec Phase E — fill thin onset / meaning / coping cells with conversational asks (≤3 total). */
function enrichCoverageFollowUps(
  extracted: ExtractedIntake,
  llmQuestions: string[],
  segmentType: string,
  round: number,
): string[] {
  const questions = [...llmQuestions];
  const addUnique = (q: string) => {
    if (questions.length >= 3) return;
    const key = q.toLowerCase();
    if (questions.some((x) => x.toLowerCase() === key)) return;
    questions.push(q);
  };

  const onset = extracted.onsetType;
  if (!onset?.value || onset.confidence < 0.7) {
    addUnique(
      'Did this start suddenly after something specific, or did it build gradually over time?',
    );
  }

  const painSegments = new Set(['pain', 'injury_recovery', 'other']);
  if (!painSegments.has(segmentType) || round >= 3) {
    return questions.slice(0, 3);
  }

  let signals: Record<string, unknown> | null = null;
  const rawSignals = extracted.painScriptSignals?.value;
  if (typeof rawSignals === 'string' && rawSignals.trim()) {
    try {
      signals = JSON.parse(rawSignals) as Record<string, unknown>;
    } catch {
      signals = null;
    }
  }

  const beliefs = (signals?.scriptBeliefs ?? null) as Record<string, unknown> | null;
  const hasSelfBelief = Boolean(beliefs && typeof beliefs.self === 'string' && beliefs.self.trim());
  const displays = (signals?.scriptDisplays ?? null) as Record<string, unknown> | null;
  const behaviours = Array.isArray(displays?.behaviours) ? displays.behaviours : [];
  const reinforcers = Array.isArray(signals?.reinforcingExperiences)
    ? signals.reinforcingExperiences
    : [];

  if (!hasSelfBelief) {
    addUnique(
      'When the pain is at its worst, what does it make you think or feel about yourself?',
    );
  } else if (behaviours.length === 0) {
    addUnique('On a tough day, what do you find yourself doing to get through — rest, push on, withdraw, or something else?');
  } else if (reinforcers.length === 0) {
    addUnique('What tends to make a bad day worse — stress, sitting too long, sleep, or something else?');
  }

  return questions.slice(0, 3);
}

// ── Main extraction function ──────────────────────────────────

export async function extractIntake(
  input: ExtractionInput,
  context?: LlmUsageContext,
): Promise<ExtractionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const model = 'anthropic/claude-sonnet-4.6';
  log('intake_extraction_start', {
    segmentType: input.segmentType,
    round: input.round,
    textLength: input.freeText.length,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pts-web-pied.vercel.app',
          'X-Title': 'PTS Intake Extractor',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'user', content: buildExtractionPrompt(input) },
          ],
          temperature: 0.3,
          max_tokens: 3000,
          usage: { include: true },
        }),
      },
    );
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    await recordLlmUsage({
      operation: 'intake_extraction',
      model,
      context,
      status: 'error',
      latencyMs,
      errorText:
        err instanceof Error ? err.message : 'request_failed',
    });
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    const err = await response.text();
    logError('intake_extraction_llm_error', new Error(err));
    await recordLlmUsage({
      operation: 'intake_extraction',
      model,
      context,
      status: 'error',
      latencyMs,
      errorText: `HTTP ${response.status}: ${err.slice(0, 500)}`,
    });
    if (response.status === 401) {
      throw new Error('LLM API auth failed — OpenRouter key missing or invalid on the server');
    }
    if (response.status === 404 && err.includes('guardrail')) {
      throw new Error(
        'LLM model policy blocked this request — allow models at openrouter.ai/settings/privacy',
      );
    }
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

  try {
    const parsed = parseExtractionResponse(raw);
    const gate = computeGateStatus(parsed.extracted, input.round);

    log('intake_extraction_complete', {
      round: input.round,
      requiredFieldsMet: gate.requiredFieldsMet,
      overallConfidence: gate.overallConfidence,
      followUpCount: parsed.followUpQuestions.length,
      costUsd: usage?.cost,
    });

    await recordLlmUsage({
      operation: 'intake_extraction',
      model,
      context,
      usage,
      status: 'success',
      latencyMs,
      requestId: data.id ?? null,
    });

    return {
      extracted: parsed.extracted,
      requiredFieldsMet: gate.requiredFieldsMet,
      missingRequired: gate.missingRequired,
      lowConfidenceRequired: gate.lowConfidenceRequired,
      followUpQuestions: enrichCoverageFollowUps(
        parsed.extracted,
        parsed.followUpQuestions,
        input.segmentType,
        input.round,
      ),
      summary: parsed.summary,
      overallConfidence: gate.overallConfidence,
    };
  } catch (parseErr) {
    logError('intake_extraction_parse_error', parseErr, {
      raw: raw.slice(0, 300),
    });
    await recordLlmUsage({
      operation: 'intake_extraction',
      model,
      context,
      usage,
      status: 'error',
      latencyMs,
      requestId: data.id ?? null,
      errorText: 'invalid_json',
    });
    throw new Error(
      'Intake extraction returned invalid JSON — retry',
    );
  }
}

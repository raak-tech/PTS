/** One structured follow-up question for the second intake pass. */
export type FollowUpItem = {
  id: string;
  question: string;
};

type ExtractionField = { value?: unknown; confidence?: number };

type ExtractionLike = {
  extracted?: Record<string, ExtractionField>;
  missingRequired?: string[];
  lowConfidenceRequired?: string[];
  followUpQuestions?: string[];
};

const MAX_QUESTIONS = 5;

/** Curated defaults keyed by thin/missing intake slots. */
const CURATED: Record<string, FollowUpItem> = {
  painDuration: {
    id: 'painDuration',
    question:
      'How long has this been going on — even a rough sense like a few weeks or several months would help.',
  },
  activitiesAffected: {
    id: 'activitiesAffected',
    question:
      'Which parts of your day does this get in the way of — work, family time, sleep, movement, or something else?',
  },
  biggestChange: {
    id: 'biggestChange',
    question:
      'Since this started, what feels most different in your life — not your goal, but how day-to-day feels now?',
  },
  recoveryGoal: {
    id: 'recoveryGoal',
    question: 'What would “better” look like for you — what are you hoping to get back to?',
  },
  onsetType: {
    id: 'onsetType',
    question:
      'Did this start suddenly after something specific, or did it build gradually over time?',
  },
};

function fieldEmptyOrThin(field: ExtractionField | undefined): boolean {
  if (!field) return true;
  const v = field.value;
  const conf = typeof field.confidence === 'number' ? field.confidence : 0;
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'string' && v.trim().length < 8) return true;
  if (conf > 0 && conf < 0.7) return true;
  return false;
}

function normalizeQuestion(q: string): string {
  return q.trim().replace(/\s+/g, ' ').toLowerCase();
}

function topicCovered(existing: string[], topic: string): boolean {
  const hay = existing.map(normalizeQuestion).join(' | ');
  switch (topic) {
    case 'painDuration':
      return /how long|weeks|months|duration/.test(hay);
    case 'activitiesAffected':
      return /get in the way|affect.*day|work|routine|energy/.test(hay);
    case 'biggestChange':
      return /most different|changed most|since this started/.test(hay);
    case 'recoveryGoal':
      return /better look like|hoping to|get back to|your goal/.test(hay);
    case 'onsetType':
      return /suddenly|gradually|build gradually/.test(hay);
    default:
      return false;
  }
}

/**
 * Build a short second-pass question pack:
 * LLM follow-ups first, then curated fills for still-thin required slots.
 * Max 5 — one structured pass, not endless rounds.
 */
export function buildFollowUpPack(result: ExtractionLike): FollowUpItem[] {
  const extracted = result.extracted ?? {};
  const pack: FollowUpItem[] = [];
  const seen = new Set<string>();

  const add = (item: FollowUpItem) => {
    if (pack.length >= MAX_QUESTIONS) return;
    const key = normalizeQuestion(item.question);
    if (!key || seen.has(key)) return;
    seen.add(key);
    pack.push(item);
  };

  for (const [i, q] of (result.followUpQuestions ?? []).entries()) {
    if (typeof q === 'string' && q.trim()) {
      add({ id: `llm_${i}`, question: q.trim() });
    }
  }

  const gapOrder = [
    'painDuration',
    'activitiesAffected',
    'biggestChange',
    'recoveryGoal',
    'onsetType',
  ] as const;

  const missing = new Set([
    ...(result.missingRequired ?? []),
    ...(result.lowConfidenceRequired ?? []),
  ]);
  const existingQs = pack.map((p) => p.question);

  for (const key of gapOrder) {
    if (missing.has(key) || fieldEmptyOrThin(extracted[key])) {
      if (topicCovered(existingQs, key)) continue;
      const curated = CURATED[key];
      if (curated) {
        add(curated);
        existingQs.push(curated.question);
      }
    }
  }

  return pack.slice(0, MAX_QUESTIONS);
}

/** Format Q&A for the extract API (appended to prior free text). */
export function formatFollowUpAnswers(
  items: FollowUpItem[],
  answers: string[],
): string {
  const lines: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const a = (answers[i] ?? '').trim();
    if (!a) continue;
    lines.push(`Q: ${items[i].question}\nA: ${a}`);
  }
  return lines.join('\n\n');
}

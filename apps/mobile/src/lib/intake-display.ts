const GARBLED_SUMMARY_RE =
  /garbled|unreadable|could not be extracted|no meaningful information|nonsensical|gibberish/i;

const SEGMENT_TOPIC: Record<string, string> = {
  pain: 'pain',
  sleep: 'sleep',
  anxiety: 'stress or anxiety',
  injury_recovery: 'recovery',
  other: 'situation',
};

const PAIN_SOURCE_LABELS: Record<string, string> = {
  workplace: 'Work-related',
  accident: 'Accident or injury',
  sports: 'Sports or activity',
  general: 'General / everyday stress',
  other: 'Something else',
};

/** Rewrite counselor third-person LLM copy into second-person client copy. */
export function toClientFacingText(text: string): string {
  let s = text.trim();
  if (!s) return s;

  s = s
    .replace(/\b[Tt]he client(?:'s)?\b/g, 'you')
    .replace(/\b[Tt]hey're\b/g, "you're")
    .replace(/\b[Tt]hey are\b/g, 'you are')
    .replace(/\b[Tt]hey feel\b/gi, 'you feel')
    .replace(/\b[Tt]hey describe\b/gi, 'you describe')
    .replace(/\b[Tt]hey experience\b/gi, 'you experience')
    .replace(/\b[Tt]heir\b/g, 'your')
    .replace(/\b[Tt]hem\b/g, 'you')
    .replace(/\b[Tt]hey\b/g, 'you')
    .replace(/\bhe\/she\b/gi, 'you');

  // "The client is" → "you is" — fix agreement after naive swaps
  s = s
    .replace(/\byou is\b/gi, 'you are')
    .replace(/\byou was\b/gi, 'you were')
    .replace(/\byou has\b/gi, 'you have')
    .replace(/\byou does\b/gi, 'you do')
    .replace(/\byou feels\b/gi, 'you feel')
    .replace(/\byou experiences\b/gi, 'you experience')
    .replace(/\byou describes\b/gi, 'you describe')
    .replace(/\byou reports\b/gi, 'you report')
    .replace(/\byou wants\b/gi, 'you want')
    .replace(/\byou needs\b/gi, 'you need')
    .replace(/\byou remains\b/gi, 'you remain');

  // Sentence-case leading "you"
  s = s.replace(/^you\b/, 'You');
  s = s.replace(/([.!?]\s+)you\b/g, '$1You');

  return s.trim();
}

/** Counselor-facing summary → client-facing copy. */
export function toClientSummary(summary: string, segmentType?: string | null): string {
  const topic = SEGMENT_TOPIC[segmentType ?? ''] ?? 'situation';

  if (GARBLED_SUMMARY_RE.test(summary)) {
    return `We could not read that clearly. Please describe your ${topic} in plain sentences — what happens, how long it has been going on, and what you would like to improve.`;
  }

  return toClientFacingText(summary);
}

const NARRATIVE_FIELDS = new Set([
  'painDescription',
  'biggestChange',
  'recoveryGoal',
  'priorTherapy',
  'currentTreatment',
  'socialSupport',
  'painSourceOther',
]);

/** Display helper — never show raw null/[] or counselor third-person to clients. */
export function formatIntakeFieldValue(value: unknown, fieldName?: string): string {
  if (value === null || value === undefined) return 'Not provided yet';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(String).join(', ') : 'Not provided yet';
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (t === '[]' || t === 'null') return 'Not provided yet';
    if (t.startsWith('[')) {
      try {
        const arr = JSON.parse(t) as unknown;
        if (Array.isArray(arr)) {
          return arr.length > 0 ? arr.map(String).join(', ') : 'Not provided yet';
        }
      } catch {
        /* use raw string */
      }
    }
    if (!t) return 'Not provided yet';
    if (fieldName === 'painSource') {
      return PAIN_SOURCE_LABELS[t] ?? t;
    }
    if (fieldName && NARRATIVE_FIELDS.has(fieldName)) {
      return toClientFacingText(t);
    }
    return t;
  }
  if (typeof value === 'object') {
    try {
      const s = JSON.stringify(value);
      if (s === '{}' || s === '[]') return 'Not provided yet';
      return s;
    } catch {
      return 'Not provided yet';
    }
  }
  return String(value);
}

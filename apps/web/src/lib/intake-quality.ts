import type { ExtractedIntake } from '@/lib/intake-extractor';

const REQUIRED_FOR_USABILITY = [
  'painDescription',
  'biggestChange',
  'recoveryGoal',
] as const;

const GARBLED_SUMMARY_RE =
  /garbled|unreadable|could not be extracted|no meaningful information|nonsensical|gibberish/i;

/** Cheap checks before calling the LLM. */
export function assessIntakeTextQuality(text: string): {
  ok: boolean;
  clientMessage: string;
} {
  const trimmed = text.trim();
  if (trimmed.length < 30) {
    return {
      ok: false,
      clientMessage: 'Tell us a bit more — at least a full sentence in your own words.',
    };
  }

  const words = trimmed
    .toLowerCase()
    .split(/[\s,.;:!?]+/)
    .filter((w) => w.length >= 2);
  const uniqueWords = new Set(words);
  if (uniqueWords.size < 4) {
    return {
      ok: false,
      clientMessage:
        'Please use everyday words to describe what is going on — we could not make sense of that yet.',
    };
  }

  const alphaRatio = (trimmed.match(/[a-zA-Z]/g)?.length ?? 0) / trimmed.length;
  if (alphaRatio < 0.5) {
    return {
      ok: false,
      clientMessage:
        'It looks like random characters or symbols. Please describe your situation in plain language.',
    };
  }

  if (/(.)\1{6,}/.test(trimmed)) {
    return {
      ok: false,
      clientMessage: 'Please rewrite in normal sentences so your counselor can understand you.',
    };
  }

  return { ok: true, clientMessage: '' };
}

function hasFieldValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** True when the model found nothing usable to confirm. */
export function isExtractionUsable(
  extracted: ExtractedIntake,
  summary: string,
): boolean {
  if (GARBLED_SUMMARY_RE.test(summary)) return false;

  const filledRequired = REQUIRED_FOR_USABILITY.filter((field) =>
    hasFieldValue(extracted[field]?.value),
  ).length;

  return filledRequired >= 1;
}

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

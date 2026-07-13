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

/** Counselor-facing summary → client-facing copy. */
export function toClientSummary(summary: string, segmentType?: string | null): string {
  const topic = SEGMENT_TOPIC[segmentType ?? ''] ?? 'situation';

  if (GARBLED_SUMMARY_RE.test(summary)) {
    return `We could not read that clearly. Please describe your ${topic} in plain sentences — what happens, how long it has been going on, and what you would like to improve.`;
  }

  return summary
    .replace(/\b[Tt]he client(?:'s)?\b/g, 'You')
    .replace(/\btheir\b/gi, 'your')
    .replace(/\bthem\b/gi, 'you')
    .replace(/\bthey\b/gi, 'you')
    .replace(/\bhe\/she\b/gi, 'you')
    .trim();
}

/** Display helper — never show raw null/[] to clients. */
export function formatIntakeFieldValue(value: unknown): string {
  if (value === null || value === undefined) return 'Not provided yet';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(String).join(', ') : 'Not provided yet';
  }
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length > 0 ? t : 'Not provided yet';
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

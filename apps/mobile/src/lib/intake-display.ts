const GARBLED_SUMMARY_RE =
  /garbled|unreadable|could not be extracted|no meaningful information|nonsensical|gibberish/i;

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

/**
 * Validated outcome instruments for the clinic pilot.
 *
 * Single source of truth for item text, response scales, and scoring. The mobile
 * app fetches these definitions (GET /api/outcome-measures/instruments) so item
 * wording never drifts, and the server always recomputes the score from raw item
 * answers — clients never submit a trusted score.
 *
 * Scoring references:
 * - TSK-11 (Woby 2005): 11 items, 1–4; items 4 and 8 reverse-scored; range 11–44.
 * - PSEQ (Nicholas): 10 items, 0–6; range 0–60; higher = better self-efficacy.
 * - PCS (Sullivan): 13 items, 0–4; range 0–52; higher = more catastrophizing.
 * - PHQ-2 / GAD-2: 2 items each, 0–3; range 0–6; >=3 = positive screen.
 * - RTS: single self-rated readiness item, 0–10.
 */

export type InstrumentId = 'tsk11' | 'rts' | 'pseq' | 'phq2' | 'gad2' | 'pcs';
export type MeasurePhase = 'baseline' | 'week6';

export type InstrumentOption = { value: number; label: string };

export type InstrumentDef = {
  id: InstrumentId;
  title: string;
  /** Short, plain-language purpose shown to the patient. */
  intro: string;
  /** Direction of a "better" outcome, for delta interpretation. */
  betterDirection: 'lower' | 'higher';
  scoreRange: { min: number; max: number };
  options: InstrumentOption[];
  items: { key: string; text: string; reverse?: boolean }[];
};

const LIKERT_1_4: InstrumentOption[] = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Agree' },
  { value: 4, label: 'Strongly agree' },
];

const CONFIDENCE_0_6: InstrumentOption[] = [
  { value: 0, label: '0 — Not at all confident' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3 — Moderately confident' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6 — Completely confident' },
];

const FREQ_0_4: InstrumentOption[] = [
  { value: 0, label: '0 — Not at all' },
  { value: 1, label: '1 — To a slight degree' },
  { value: 2, label: '2 — To a moderate degree' },
  { value: 3, label: '3 — To a great degree' },
  { value: 4, label: '4 — All the time' },
];

const PHQ_GAD_0_3: InstrumentOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const READINESS_0_10: InstrumentOption[] = Array.from({ length: 11 }, (_, i) => ({
  value: i,
  label:
    i === 0 ? '0 — Not at all ready' : i === 10 ? '10 — Completely ready' : String(i),
}));

export const INSTRUMENTS: Record<InstrumentId, InstrumentDef> = {
  tsk11: {
    id: 'tsk11',
    title: 'Movement & activity beliefs (TSK-11)',
    intro: 'How much you agree with each statement about pain and movement right now.',
    betterDirection: 'lower',
    scoreRange: { min: 11, max: 44 },
    options: LIKERT_1_4,
    items: [
      { key: 'q1', text: "I'm afraid I might injure myself if I exercise." },
      { key: 'q2', text: 'If I were to try to overcome it, my pain would increase.' },
      { key: 'q3', text: 'My body is telling me I have something dangerously wrong.' },
      { key: 'q4', text: 'Pain would probably be relieved if I were to exercise.', reverse: true },
      { key: 'q5', text: "People aren't taking my medical condition seriously enough." },
      { key: 'q6', text: 'My problem has put my body at risk for the rest of my life.' },
      { key: 'q7', text: 'Pain always means I have injured my body.' },
      { key: 'q8', text: 'Just because something aggravates my pain does not mean it is dangerous.', reverse: true },
      { key: 'q9', text: 'I am afraid that I might injure myself accidentally.' },
      { key: 'q10', text: 'Simply being careful not to make unnecessary movements is the safest thing I can do to prevent my pain from worsening.' },
      { key: 'q11', text: "I wouldn't have this much pain if there weren't something potentially dangerous going on in my body." },
    ],
  },
  rts: {
    id: 'rts',
    title: 'Readiness to return to your activity',
    intro: 'How ready you feel to return to your sport or main physical activity.',
    betterDirection: 'higher',
    scoreRange: { min: 0, max: 10 },
    options: READINESS_0_10,
    items: [
      { key: 'q1', text: 'How ready do you feel to return to your sport or main physical activity?' },
    ],
  },
  pseq: {
    id: 'pseq',
    title: 'Pain Self-Efficacy (PSEQ)',
    intro: 'How confident you are that you can do these things at the moment, despite the pain.',
    betterDirection: 'higher',
    scoreRange: { min: 0, max: 60 },
    options: CONFIDENCE_0_6,
    items: [
      { key: 'q1', text: 'I can enjoy things, despite the pain.' },
      { key: 'q2', text: 'I can do most of the household chores, despite the pain.' },
      { key: 'q3', text: 'I can socialise with my friends or family as often as I used to, despite the pain.' },
      { key: 'q4', text: 'I can cope with my pain in most situations.' },
      { key: 'q5', text: 'I can do some form of work, despite the pain (paid, unpaid, or housework).' },
      { key: 'q6', text: 'I can still do many of the things I enjoy, such as hobbies or leisure, despite the pain.' },
      { key: 'q7', text: 'I can cope with my pain without medication.' },
      { key: 'q8', text: 'I can still accomplish most of my goals in life, despite the pain.' },
      { key: 'q9', text: 'I can live a normal lifestyle, despite the pain.' },
      { key: 'q10', text: 'I can gradually become more active, despite the pain.' },
    ],
  },
  phq2: {
    id: 'phq2',
    title: 'Mood check (PHQ-2)',
    intro: 'Over the last 2 weeks, how often have you been bothered by the following?',
    betterDirection: 'lower',
    scoreRange: { min: 0, max: 6 },
    options: PHQ_GAD_0_3,
    items: [
      { key: 'q1', text: 'Little interest or pleasure in doing things.' },
      { key: 'q2', text: 'Feeling down, depressed, or hopeless.' },
    ],
  },
  gad2: {
    id: 'gad2',
    title: 'Worry check (GAD-2)',
    intro: 'Over the last 2 weeks, how often have you been bothered by the following?',
    betterDirection: 'lower',
    scoreRange: { min: 0, max: 6 },
    options: PHQ_GAD_0_3,
    items: [
      { key: 'q1', text: 'Feeling nervous, anxious, or on edge.' },
      { key: 'q2', text: 'Not being able to stop or control worrying.' },
    ],
  },
  pcs: {
    id: 'pcs',
    title: 'Thoughts about pain (PCS)',
    intro: 'When you are in pain, how often do you have each of these thoughts or feelings?',
    betterDirection: 'lower',
    scoreRange: { min: 0, max: 52 },
    options: FREQ_0_4,
    items: [
      { key: 'q1', text: 'I worry all the time about whether the pain will end.' },
      { key: 'q2', text: "I feel I can't go on." },
      { key: 'q3', text: "It's terrible and I think it's never going to get any better." },
      { key: 'q4', text: "It's awful and I feel that it overwhelms me." },
      { key: 'q5', text: "I feel I can't stand it anymore." },
      { key: 'q6', text: 'I become afraid that the pain will get worse.' },
      { key: 'q7', text: 'I keep thinking of other painful events.' },
      { key: 'q8', text: 'I anxiously want the pain to go away.' },
      { key: 'q9', text: "I can't seem to keep it out of my mind." },
      { key: 'q10', text: 'I keep thinking about how much it hurts.' },
      { key: 'q11', text: 'I keep thinking about how badly I want the pain to stop.' },
      { key: 'q12', text: "There's nothing I can do to reduce the intensity of the pain." },
      { key: 'q13', text: 'I wonder whether something serious may happen.' },
    ],
  },
};

/** The full pilot instrument set, in the order patients complete them. */
export const PILOT_INSTRUMENT_ORDER: InstrumentId[] = [
  'tsk11',
  'rts',
  'pseq',
  'pcs',
  'phq2',
  'gad2',
];

/** Instruments summarised as clinic-level aggregate deltas (de-identified). */
export const AGGREGATE_DELTA_INSTRUMENTS: InstrumentId[] = ['tsk11', 'rts', 'pseq'];

export function isInstrumentId(value: unknown): value is InstrumentId {
  return typeof value === 'string' && value in INSTRUMENTS;
}

export function isMeasurePhase(value: unknown): value is MeasurePhase {
  return value === 'baseline' || value === 'week6';
}

export type ScoreResult =
  | { ok: true; score: number; normalized: Record<string, number> }
  | { ok: false; error: string };

/**
 * Validate raw item answers against the instrument definition and compute the
 * authoritative score. Rejects missing/out-of-range answers so a client can
 * never submit a fabricated score.
 */
export function scoreInstrument(
  id: InstrumentId,
  rawAnswers: Record<string, unknown>,
): ScoreResult {
  const def = INSTRUMENTS[id];
  const allowed = new Set(def.options.map((o) => o.value));
  const maxOption = Math.max(...def.options.map((o) => o.value));
  const minOption = Math.min(...def.options.map((o) => o.value));

  const normalized: Record<string, number> = {};
  let score = 0;
  for (const item of def.items) {
    const raw = rawAnswers[item.key];
    const value = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isInteger(value) || !allowed.has(value)) {
      return { ok: false, error: `invalid_answer:${item.key}` };
    }
    const contribution = item.reverse ? maxOption + minOption - value : value;
    normalized[item.key] = value;
    score += contribution;
  }

  return { ok: true, score, normalized };
}

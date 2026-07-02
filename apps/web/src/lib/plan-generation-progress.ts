export const PLAN_GENERATION_STEPS = [
  'Reading latest intake…',
  'Calling AI (Claude via OpenRouter)…',
  'Building Week 1 program…',
  'Adding Ayurveda, yoga & music blocks…',
  'Validating plan structure…',
] as const;

export const PLAN_GENERATION_HINT =
  'This usually takes 2–4 minutes. Please keep this tab open.';

export function stepIndexForElapsed(seconds: number): number {
  if (seconds < 20) return 0;
  if (seconds < 50) return 1;
  if (seconds < 110) return 2;
  if (seconds < 170) return 3;
  return 4;
}

export function formatGenerationElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

import type { WeeklySummary } from '@/lib/weekly-summary';

export type RescoreGateResult = {
  shouldRescore: boolean;
  reasons: string[];
};

const MATERIAL_PAIN_DELTA = 2;
const LOW_ADHERENCE_RATIO = 0.35;

/** §17.3 — non-LLM gate before formulation rescore LLM call. */
export function shouldTriggerFormulationRescore(
  summary: WeeklySummary,
  checkInFreeText: string,
): RescoreGateResult {
  const reasons: string[] = [];

  if (summary.painTrend?.includes('Pain rose') || summary.painTrend?.startsWith('Pain rose')) {
    reasons.push('pain_trend_worsening');
  }

  const checkIns = summary.morningCheckIns;
  if (checkIns.length >= 3) {
    const pains = checkIns.map((c) => c.painLevel).filter((p) => p != null);
    if (pains.length >= 3) {
      const firstHalf = pains.slice(0, Math.floor(pains.length / 2));
      const secondHalf = pains.slice(Math.floor(pains.length / 2));
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const delta = avg(secondHalf) - avg(firstHalf);
      if (delta >= MATERIAL_PAIN_DELTA) {
        reasons.push(`pain_delta_+${delta.toFixed(1)}`);
      }
    }
  }

  const totalBlocks = summary.blocksCompleted + summary.blocksSkipped;
  if (totalBlocks > 0 && summary.blocksCompleted / totalBlocks < LOW_ADHERENCE_RATIO) {
    reasons.push('low_adherence');
  }

  const flareWords = /flare|setback|much worse|can't cope|giving up|hopeless/i;
  if (flareWords.test(checkInFreeText)) {
    reasons.push('checkin_language_flag');
  }

  if (summary.eveningReflectionCount === 0 && summary.blocksCompleted > 0) {
    reasons.push('no_reflections_despite_activity');
  }

  return {
    shouldRescore: reasons.length > 0,
    reasons,
  };
}

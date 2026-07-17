import type { GeneratedPlan } from '@/lib/holistic-plan-types';

export type HolisticVisibility = {
  ayurveda: boolean;
  yoga: boolean;
  music: boolean;
};

export const DEFAULT_HOLISTIC_VISIBILITY: HolisticVisibility = {
  ayurveda: true,
  yoga: true,
  music: true,
};

export function applyHolisticVisibility(
  plan: GeneratedPlan,
  visibility: HolisticVisibility,
): GeneratedPlan {
  return {
    ...plan,
    weeks: plan.weeks.map((week) => ({
      ...week,
      ayurvedaBlock: visibility.ayurveda ? week.ayurvedaBlock : undefined,
      yogicPractice: visibility.yoga ? week.yogicPractice : undefined,
      yogaTrial: visibility.yoga ? week.yogaTrial : undefined,
      musicMoment: visibility.music ? week.musicMoment : undefined,
    })),
  };
}

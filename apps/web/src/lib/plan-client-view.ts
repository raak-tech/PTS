import type { DailyPractice, GeneratedPlan, WeekPlan } from '@/lib/holistic-plan-types';

type ClientDailyPractice = Pick<DailyPractice, 'title' | 'description' | 'duration'>;

export type ClientFacingWeek = Omit<
  WeekPlan,
  | 'counselorNote'
  | 'targets'
  | 'personalizationBasis'
  | 'dailyPractices'
  | 'ayurvedaBlock'
  | 'yogicPractice'
  | 'yogaTrial'
  | 'musicMoment'
> & {
  personalizationBasis?: string;
  dailyPractices: ClientDailyPractice[];
  ayurvedaBlock?: Omit<NonNullable<WeekPlan['ayurvedaBlock']>, 'targets' | 'mechanism'> & {
    personalizationBasis?: string;
  };
  yogicPractice?: Omit<NonNullable<WeekPlan['yogicPractice']>, 'targets' | 'mechanism'> & {
    personalizationBasis?: string;
  };
  yogaTrial?: WeekPlan['yogaTrial'];
  musicMoment?: Omit<NonNullable<WeekPlan['musicMoment']>, 'targets' | 'mechanism'> & {
    personalizationBasis?: string;
  };
};

export type ClientFacingPlan = Omit<
  GeneratedPlan,
  'protectedFormulation' | 'clientSummary' | 'keyThemes' | 'watchPoints' | 'weeks'
> & {
  weeks: ClientFacingWeek[];
};

function stripPractice(p: DailyPractice): ClientDailyPractice {
  return {
    title: p.title,
    description: p.description,
    duration: p.duration,
  };
}

function stripWeek(week: WeekPlan): ClientFacingWeek {
  const {
    counselorNote: _cn,
    targets: _wt,
    dailyPractices,
    ayurvedaBlock,
    yogicPractice,
    yogaTrial,
    musicMoment,
    personalizationBasis,
    ...rest
  } = week;

  return {
    ...rest,
    personalizationBasis,
    dailyPractices: dailyPractices.map(stripPractice),
    ayurvedaBlock: ayurvedaBlock
      ? {
          dietaryGuidance: ayurvedaBlock.dietaryGuidance,
          foodsToFavour: ayurvedaBlock.foodsToFavour,
          foodsToAvoid: ayurvedaBlock.foodsToAvoid,
          rhythmNote: ayurvedaBlock.rhythmNote,
          disclaimer: ayurvedaBlock.disclaimer,
          practices: ayurvedaBlock.practices,
          personalizationBasis: ayurvedaBlock.personalizationBasis,
        }
      : undefined,
    yogicPractice: yogicPractice
      ? {
          breathingTechnique: yogicPractice.breathingTechnique,
          meditation: yogicPractice.meditation,
          philosophicalFraming: yogicPractice.philosophicalFraming,
          disclaimer: yogicPractice.disclaimer,
          personalizationBasis: yogicPractice.personalizationBasis,
        }
      : undefined,
    yogaTrial,
    musicMoment: musicMoment
      ? {
          purpose: musicMoment.purpose,
          mood: musicMoment.mood,
          suggestion: musicMoment.suggestion,
          searchTerms: musicMoment.searchTerms,
          language: musicMoment.language,
          resolvedTracks: musicMoment.resolvedTracks,
          resolvedTrackIds: musicMoment.resolvedTrackIds,
          playlist: musicMoment.playlist,
          personalizationBasis: musicMoment.personalizationBasis,
        }
      : undefined,
  };
}

/** Remove counselor-only plan fields before returning plan JSON to clients. */
export function stripCounselorOnlyPlanFields(plan: GeneratedPlan): ClientFacingPlan {
  const {
    protectedFormulation: _pf,
    clientSummary: _cs,
    keyThemes: _kt,
    watchPoints: _wp,
    weeks,
    ...clientPlan
  } = plan;

  return {
    ...clientPlan,
    weeks: weeks.map(stripWeek),
  };
}

export function stripCounselorOnlyFromPlanContent(generatedContent: string): string {
  try {
    const plan = JSON.parse(generatedContent) as GeneratedPlan;
    return JSON.stringify(stripCounselorOnlyPlanFields(plan));
  } catch {
    return generatedContent;
  }
}

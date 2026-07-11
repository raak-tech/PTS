import type { GeneratedPlan, WeekPlan } from '@/lib/plan-generator';

type ClientFacingWeek = Omit<WeekPlan, 'counselorNote'>;

export type ClientFacingPlan = Omit<
  GeneratedPlan,
  'protectedFormulation' | 'clientSummary' | 'keyThemes' | 'watchPoints' | 'weeks'
> & {
  weeks: ClientFacingWeek[];
};

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
    weeks: weeks.map(({ counselorNote: _cn, ...clientWeek }) => clientWeek),
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

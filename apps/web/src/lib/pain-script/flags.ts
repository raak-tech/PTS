import type { PilotCohort } from '@/lib/pain-script/types';

export function isPainScriptEngineEnabled(): boolean {
  return process.env.PAIN_SCRIPT_ENABLED === 'true';
}

export function isPainScriptCohort(cohort: string | null | undefined): cohort is 'pain_script' {
  return cohort === 'pain_script';
}

export function usesPainScriptPath(cohort: string | null | undefined): boolean {
  return isPainScriptEngineEnabled() && isPainScriptCohort(cohort);
}

export function defaultCohortFromBuild(): PilotCohort {
  if (process.env.NEXT_PUBLIC_PILOT_COHORT === 'pain_script') return 'pain_script';
  return 'legacy';
}

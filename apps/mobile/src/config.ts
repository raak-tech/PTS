/** API base URL for PTS backend (Next.js on Vercel). */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://pts-web-pied.vercel.app';

/** A/B pilot cohort baked into APK B builds. */
export const PILOT_COHORT =
  (process.env.EXPO_PUBLIC_PILOT_COHORT as 'legacy' | 'pain_script' | undefined) ?? 'legacy';

export const IS_PAIN_SCRIPT_COHORT = PILOT_COHORT === 'pain_script';

/** Use mock auth when true (prototype without backend). */
export const USE_MOCK_AUTH = process.env.EXPO_PUBLIC_USE_MOCK_AUTH === 'true';

/** Use legacy multi-step intake when true (false = new onboarding flow). */
export const USE_LEGACY_INTAKE = false;

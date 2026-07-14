import { Redirect } from 'expo-router';

/**
 * Entry for `/(client)/intake`. New flow starts at segment.
 * Legacy multi-step form lives in `legacy.tsx` (opt-in only).
 */
export default function IntakeIndex() {
  if (process.env.EXPO_PUBLIC_USE_LEGACY_INTAKE === 'true') {
    return <Redirect href="/(client)/intake/legacy" />;
  }
  return <Redirect href="/(client)/intake/segment" />;
}

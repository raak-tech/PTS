import { Stack } from 'expo-router';

/**
 * Nested intake stack. Do NOT also keep `app/(client)/intake.tsx` —
 * Expo Router treats that as a duplicate screen named `intake` and crashes
 * on launch (Native Stack: "cannot contain multiple Screen components
 * with the same name").
 */
export default function IntakeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="segment" />
      <Stack.Screen name="onebox" />
      <Stack.Screen name="follow-up" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="legacy" />
    </Stack>
  );
}

import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function ClientLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (!loading && (!user || user.role !== 'client')) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="intake" options={{ title: 'Assessment', headerShown: false }} />
      <Stack.Screen name="intake-complete" options={{ title: 'Complete' }} />
      <Stack.Screen name="graduation" options={{ title: 'Graduation', headerShown: false }} />
      <Stack.Screen name="waiting-plan" options={{ title: 'Your plan' }} />
      <Stack.Screen name="program/week/[id]" options={{ title: 'Week' }} />
      <Stack.Screen name="program/check-in" options={{ title: 'Weekly check-in' }} />
      <Stack.Screen name="messages/[id]" options={{ title: 'Conversation' }} />
      <Stack.Screen name="profile/safety" options={{ title: 'Safety' }} />
      <Stack.Screen name="profile/data" options={{ title: 'Your data' }} />
      <Stack.Screen name="profile/flare-up" options={{ title: 'Flare-up support' }} />
    </Stack>
  );
}

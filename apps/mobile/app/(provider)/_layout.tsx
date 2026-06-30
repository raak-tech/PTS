import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function ProviderLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (!loading && (!user || user.role !== 'provider')) {
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
      <Stack.Screen name="clients/[id]" options={{ title: 'Client' }} />
      <Stack.Screen name="plan-review/[id]" options={{ title: 'Review plan' }} />
      <Stack.Screen name="messages/[id]" options={{ title: 'Conversation' }} />
      <Stack.Screen name="engagement" options={{ title: 'Daily engagement' }} />
    </Stack>
  );
}

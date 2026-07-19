import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { USE_MOCK_AUTH } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useProgramTime } from '@/hooks/useProgramTime';

export default function Index() {
  const { user, loading, refreshUser } = useAuth();
  const { colors } = useTheme();
  const programTime = useProgramTime();

  useEffect(() => {
    if (loading || !user || USE_MOCK_AUTH) return;
    void refreshUser();
  }, [loading, user?.id, refreshUser]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#3D4F44',
          gap: 24,
        }}
      >
        <BrandMark size="lg" onDark />
        <ActivityIndicator size="large" color="#FFFCF7" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  if (user.role === 'provider') return <Redirect href="/(provider)/(tabs)" />;

  if (!user.intakeComplete) return <Redirect href="/(client)/clinic-enroll" />;
  if (!user.planApproved) return <Redirect href="/(client)/waiting-plan" />;
  if (programTime?.programComplete) return <Redirect href="/(client)/graduation" />;

  return <Redirect href="/(client)/(tabs)/today" />;
}

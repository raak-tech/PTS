import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useProgramTime } from '@/hooks/useProgramTime';

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const programTime = useProgramTime();

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

  if (!user.intakeComplete) return <Redirect href="/(client)/intake" />;
  if (!user.planApproved) return <Redirect href="/(client)/waiting-plan" />;
  if (programTime?.programComplete) return <Redirect href="/(client)/graduation" />;

  return <Redirect href="/(client)/(tabs)/today" />;
}

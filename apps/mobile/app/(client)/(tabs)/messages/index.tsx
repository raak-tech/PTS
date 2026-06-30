import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { useCounselorContact } from '@/hooks/useClientData';

export default function MessagesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { counselorId } = useCounselorContact();

  useEffect(() => {
    if (counselorId) {
      router.replace(`/(client)/messages/${counselorId}`);
    }
  }, [counselorId, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiGetContacts } from '@/lib/api';

type LoadState = 'loading' | 'redirecting' | 'empty' | 'error';

export default function MessagesListScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    if (!token) {
      setState('empty');
      return;
    }
    void apiGetContacts(token)
      .then((data) => {
        if (data.counselor?.id) {
          setState('redirecting');
          router.replace(`/(client)/messages/${data.counselor.id}`);
        } else {
          setState('empty');
        }
      })
      .catch(() => setState('error'));
  }, [token, router]);

  if (state === 'loading' || state === 'redirecting') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (state === 'error') {
    return (
      <Screen layout="tab" title="Messages" subtitle="Could not load">
        <Text style={{ fontSize: 15, color: colors.muted, lineHeight: 22 }}>
          We couldn&apos;t reach the server. Check your connection and try again.
        </Text>
        <Button
          label="Try again"
          variant="secondary"
          onPress={() => {
            setState('loading');
            if (!token) return;
            void apiGetContacts(token)
              .then((data) => {
                if (data.counselor?.id) {
                  router.replace(`/(client)/messages/${data.counselor.id}`);
                } else {
                  setState('empty');
                }
              })
              .catch(() => setState('error'));
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen layout="tab" title="Messages" subtitle="Counselor messaging">
      <Text style={{ fontSize: 15, color: colors.muted, lineHeight: 22 }}>
        No counselor is assigned to your account yet. Contact your program administrator to get connected.
      </Text>
    </Screen>
  );
}

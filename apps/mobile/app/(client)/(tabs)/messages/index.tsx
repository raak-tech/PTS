import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiGetContacts } from '@/lib/api';

export default function MessagesListScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [counselor, setCounselor] = useState<{ id: string; name: string; unreadCount: number } | null>(null);
  const styles = useThemedStyles((c) => ({
    row: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 8 },
    preview: { flex: 1, fontSize: 14, color: c.muted },
    badge: {
      backgroundColor: c.danger,
      borderRadius: 999,
      minWidth: 20,
      height: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 6,
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' as const },
    empty: { fontSize: 14, color: c.muted, lineHeight: 22 },
  }));

  useEffect(() => {
    if (!token) return;
    void apiGetContacts(token)
      .then((data) => setCounselor(data.counselor ?? null))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Screen layout="tab" title="Messages" subtitle="Async chat with your counselor">
      {counselor ? (
        <Card title={counselor.name} onPress={() => router.push(`/(client)/messages/${counselor.id}`)}>
          <View style={styles.row}>
            <Text style={styles.preview}>Tap to open your conversation</Text>
            {counselor.unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{counselor.unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </Card>
      ) : (
        <Text style={styles.empty}>
          Your counselor will appear here once your plan is approved and you are assigned.
        </Text>
      )}
    </Screen>
  );
}

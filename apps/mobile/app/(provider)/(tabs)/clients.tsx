import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiGetProviderQueue } from '@/lib/api';

export default function ProviderClientsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<
    { id: string; name: string; planStatus: string; hasRedFlag: boolean; unreadCount: number }[]
  >([]);
  const styles = useThemedStyles((c) => ({
    meta: { fontSize: 13, color: c.muted, marginTop: 4 },
    flag: { color: c.danger, fontWeight: '700' as const },
  }));

  useEffect(() => {
    if (!token) return;
    void apiGetProviderQueue(token)
      .then((q) => setClients(q.clients))
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
    <Screen layout="tab" title="Clients" subtitle="All registered clients">
      {clients.map((client) => (
        <Card
          key={client.id}
          title={client.name}
          onPress={() => router.push(`/(provider)/clients/${client.id}`)}
        >
          <Text style={styles.meta}>
            Plan: {client.planStatus}
            {client.unreadCount > 0 ? ` · ${client.unreadCount} unread` : ''}
          </Text>
          {client.hasRedFlag ? <Text style={styles.flag}>Red flag on intake</Text> : null}
        </Card>
      ))}
    </Screen>
  );
}

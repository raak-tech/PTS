import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiGetContacts } from '@/lib/api';

export default function ProviderMessagesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{ id: string; name: string; unreadCount: number }[]>([]);
  const styles = useThemedStyles((c) => ({
    meta: { fontSize: 13, color: c.muted },
    badge: { color: c.danger, fontWeight: '700' as const },
  }));

  useEffect(() => {
    if (!token) return;
    void apiGetContacts(token)
      .then((data) => setClients(data.clients ?? []))
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
    <Screen layout="tab" title="Messages" subtitle="Client conversations">
      {clients.map((client) => (
        <Card key={client.id} title={client.name} onPress={() => router.push(`/(provider)/messages/${client.id}`)}>
          {client.unreadCount > 0 ? (
            <Text style={styles.badge}>{client.unreadCount} unread</Text>
          ) : (
            <Text style={styles.meta}>Open conversation</Text>
          )}
        </Card>
      ))}
    </Screen>
  );
}

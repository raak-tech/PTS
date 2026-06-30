import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiGetProviderEngagement, apiGetProviderQueue } from '@/lib/api';

export default function ProviderHomeScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof apiGetProviderQueue>> | null>(null);
  const [engagement, setEngagement] = useState<Awaited<ReturnType<typeof apiGetProviderEngagement>> | null>(null);
  const styles = useThemedStyles((c) => ({
    body: { fontSize: 14, color: c.muted, lineHeight: 22 },
    alert: { color: c.danger, fontWeight: '700' as const },
    row: { fontSize: 14, color: c.text, lineHeight: 22 },
  }));

  useEffect(() => {
    if (!token) return;
    void Promise.all([apiGetProviderQueue(token), apiGetProviderEngagement(token)])
      .then(([q, e]) => {
        setQueue(q);
        setEngagement(e);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const pending = queue?.pendingPlans ?? [];
  const unread = queue?.unreadMessages ?? [];
  const needsAttention = engagement?.clients.filter((c) => c.needsAttention) ?? [];

  return (
    <Screen layout="tab" title="Work queue" subtitle="Plans, messages, and daily engagement">
      {queue && queue.redFlags > 0 ? (
        <Card title="Escalations" alert>
          <Text style={[styles.body, styles.alert]}>{queue.redFlags} client(s) flagged — review urgently</Text>
        </Card>
      ) : null}

      <Card title={`Daily engagement (${needsAttention.length} need attention)`}>
        {needsAttention.length === 0 ? (
          <Text style={styles.body}>All assigned clients are on track today.</Text>
        ) : (
          needsAttention.slice(0, 3).map((c) => (
            <Card key={c.clientId} onPress={() => router.push(`/(provider)/clients/${c.clientId}`)}>
              <Text style={styles.row}>
                {c.name} — read-out {c.reinforcementRecordedToday ? 'done' : 'pending'}
              </Text>
            </Card>
          ))
        )}
        <Button label="View full engagement" variant="secondary" onPress={() => router.push('/(provider)/engagement')} />
      </Card>

      <Card title={`Pending plan reviews (${pending.length})`}>
        {pending.length === 0 ? (
          <Text style={styles.body}>No plans awaiting review.</Text>
        ) : (
          pending.map((p) => (
            <Card
              key={p.id}
              onPress={() => router.push(`/(provider)/plan-review/${p.id}?clientId=${p.clientId}`)}
            >
              <Text style={styles.row}>
                {p.clientName} · submitted {new Date(p.createdAt).toLocaleDateString()}
              </Text>
            </Card>
          ))
        )}
      </Card>

      <Card title={`Unread messages (${unread.reduce((n, u) => n + u.count, 0)})`}>
        {unread.length === 0 ? (
          <Text style={styles.body}>No unread messages.</Text>
        ) : (
          unread.map((m) => (
            <Card key={m.clientId} onPress={() => router.push(`/(provider)/messages/${m.clientId}`)}>
              <Text style={styles.row}>
                {m.clientName} ({m.count})
              </Text>
            </Card>
          ))
        )}
      </Card>
    </Screen>
  );
}

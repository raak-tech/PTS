import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiGetProviderEngagement } from '@/lib/api';

export default function ProviderEngagementScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof apiGetProviderEngagement>> | null>(null);
  const styles = useThemedStyles((c) => ({
    row: { fontSize: 14, color: c.text, lineHeight: 22 },
    attention: { color: c.danger, fontWeight: '700' as const },
    stat: { fontSize: 13, color: c.muted, marginTop: 4 },
  }));

  useEffect(() => {
    if (!token) return;
    void apiGetProviderEngagement(token)
      .then(setData)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const clients = data?.clients ?? [];
  const needsAttention = clients.filter((c) => c.needsAttention);

  return (
    <Screen showCrisis={false}>
      {data?.date ? <Text style={styles.stat}>Snapshot for {data.date}</Text> : null}
      <Card title={`${needsAttention.length} need attention`}>
        {needsAttention.length === 0 ? (
          <Text style={styles.row}>All clients are on track today.</Text>
        ) : (
          needsAttention.map((c) => (
            <Card key={c.clientId} onPress={() => router.push(`/(provider)/clients/${c.clientId}`)}>
              <Text style={[styles.row, styles.attention]}>{c.name}</Text>
              <Text style={styles.stat}>
                Read-out: {c.reinforcementRecordedToday ? 'done' : 'pending'} · Calendar{' '}
                {c.calendarBlocksDone}/{c.calendarBlocksTotal} · Holistic {c.holisticDone ?? 0}/{c.holisticTotal ?? 3}
              </Text>
            </Card>
          ))
        )}
      </Card>

      <Card title={`All clients (${clients.length})`}>
        {clients.map((c) => (
          <Card key={c.clientId} onPress={() => router.push(`/(provider)/clients/${c.clientId}`)}>
            <Text style={styles.row}>{c.name}</Text>
            <Text style={styles.stat}>
              {c.reinforcementTitle ?? 'No read-out'} · {c.reinforcementRecordedToday ? '✓ responded' : '○ pending'}
            </Text>
            <Text style={styles.stat}>
              Calendar {c.calendarBlocksDone}/{c.calendarBlocksTotal} · Holistic {c.holisticDone ?? 0}/
              {c.holisticTotal ?? 3}
            </Text>
          </Card>
        ))}
      </Card>

      <Button label="Back to queue" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

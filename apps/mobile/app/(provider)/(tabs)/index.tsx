import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, Alert, Linking } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ClientStoryCard } from '@/components/provider/ClientStoryCard';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useProviderQueueBadge } from '@/hooks/useProviderQueueBadge';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  apiGeneratePlan,
  apiGetPendingIntakes,
  apiGetProviderEngagement,
  apiGetProviderQueue,
} from '@/lib/api';
import { caseloadUrl, chartUrl, formulationUrl } from '@/lib/counselorWeb';

export default function ProviderHomeScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors } = useTheme();
  const { markQueueViewed } = useProviderQueueBadge();
  const [loading, setLoading] = useState(true);
  const [engagementStatus, setEngagementStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof apiGetProviderQueue>> | null>(null);
  const [engagement, setEngagement] = useState<Awaited<ReturnType<typeof apiGetProviderEngagement>> | null>(
    null,
  );
  const [pendingIntakes, setPendingIntakes] = useState<Awaited<
    ReturnType<typeof apiGetPendingIntakes>
  > | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const styles = useThemedStyles((c) => ({
    body: { fontSize: 14, color: c.muted, lineHeight: 22 },
    alert: { color: c.danger, fontWeight: '700' as const },
    row: { fontSize: 14, color: c.text, lineHeight: 22 },
    webLink: { fontSize: 13, color: '#f97316', fontWeight: '600' as const, marginTop: 8 },
  }));

  useFocusEffect(
    useCallback(() => {
      markQueueViewed();
    }, [markQueueViewed]),
  );

  useEffect(() => {
    if (!token) return;
    setEngagementStatus('loading');
    void Promise.all([
      apiGetProviderQueue(token),
      apiGetProviderEngagement(token)
        .then((e) => {
          setEngagement(e);
          setEngagementStatus('ready');
          return e;
        })
        .catch(() => {
          setEngagementStatus('unavailable');
          return null;
        }),
      apiGetPendingIntakes(token),
    ])
      .then(([q, , p]) => {
        setQueue(q);
        setPendingIntakes(p);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const handleGeneratePlan = async (userId: string) => {
    if (!token) return;
    setGenerating(userId);
    try {
      const result = await apiGeneratePlan(token, userId);
      if (result.ok) {
        Alert.alert('Success', 'Week 1 draft generated. Open it from Pending plan reviews.');
        const [updated, q] = await Promise.all([
          apiGetPendingIntakes(token),
          apiGetProviderQueue(token),
        ]);
        setPendingIntakes(updated);
        setQueue(q);
        return;
      }
      const reason = result.reason ?? 'Unknown error';
      if (reason === 'formulation_not_approved' || reason === 'formulation_missing') {
        Alert.alert(
          'Formulation required',
          'Approve the clinical formulation on the web before generating Week 1.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open formulation on web',
              onPress: () => void Linking.openURL(formulationUrl(userId)),
            },
          ],
        );
        return;
      }
      if (reason === 'intake_incomplete') {
        Alert.alert('Intake incomplete', 'This client has not finished intake yet.');
        return;
      }
      Alert.alert('Could not generate Week 1', reason, [
        { text: 'OK', style: 'cancel' },
        {
          text: 'Open Chart on web',
          onPress: () => void Linking.openURL(chartUrl(userId, { tab: 'plan' })),
        },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to generate plan', [
        { text: 'OK', style: 'cancel' },
        {
          text: 'Open Caseload on web',
          onPress: () => void Linking.openURL(caseloadUrl('plans')),
        },
      ]);
    } finally {
      setGenerating(null);
    }
  };

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
  const intakes = pendingIntakes?.pendingIntakes ?? [];

  return (
    <Screen layout="tab" title="Queue" subtitle="Caseload-lite · Plans, messages, engagement">
      {queue && queue.redFlags > 0 ? (
        <Card title="Escalations" alert>
          <Text style={[styles.body, styles.alert]}>{queue.redFlags} client(s) flagged — review urgently</Text>
        </Card>
      ) : null}

      <Card title={`Daily engagement (${needsAttention.length} need attention)`}>
        {engagementStatus === 'unavailable' ? (
          <Text style={styles.body}>Today&apos;s progress unavailable — open Chart on web if needed.</Text>
        ) : needsAttention.length === 0 ? (
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

      {intakes.length > 0 ? (
        <Card title={`Pending intakes (${intakes.length})`}>
          {intakes.map((intake) => (
            <View key={intake.userId} style={{ marginBottom: 16 }}>
              <Text style={styles.row}>{intake.anonEmail}</Text>
              <ClientStoryCard
                embedded
                story={{
                  painSource: intake.painSource,
                  painDescription: intake.painDescription,
                  recoveryGoal: intake.recoveryGoal,
                  hasRedFlags: intake.hasRedFlags,
                  isSafe: intake.isSafe,
                }}
              />
              <Text style={[styles.body, { marginBottom: 8 }]}>
                Submitted {new Date(intake.submittedAt).toLocaleDateString()}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Message"
                    variant="secondary"
                    onPress={() => router.push(`/(provider)/messages/${intake.userId}`)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={generating === intake.userId ? 'Generating…' : 'Generate Week 1'}
                    disabled={generating === intake.userId}
                    onPress={() => void handleGeneratePlan(intake.userId)}
                  />
                </View>
              </View>
              <Text
                style={styles.webLink}
                onPress={() => void Linking.openURL(chartUrl(intake.userId, { tab: 'plan' }))}
              >
                Open Chart on web →
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

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
              {p.intake ? (
                <Text style={styles.body} numberOfLines={2}>
                  {p.intake.painSource}
                  {p.intake.recoveryGoal ? ` · Goal: ${p.intake.recoveryGoal}` : ''}
                </Text>
              ) : null}
              {(p.intake?.hasRedFlags || p.intake?.isSafe === false) ? (
                <Text style={styles.alert}>Safety flag</Text>
              ) : null}
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

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiGetContacts, apiGetPlan } from '@/lib/api';

export default function WaitingPlanScreen() {
  const router = useRouter();
  const { token, refreshUser } = useAuth();
  const [planStatus, setPlanStatus] = useState<'draft' | 'none' | 'approved'>('draft');
  const styles = useThemedStyles((c) => ({
    line: { fontSize: 15, color: c.text, lineHeight: 24 },
    muted: { fontSize: 15, color: c.faint, lineHeight: 24 },
  }));

  const [counselorId, setCounselorId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void apiGetContacts(token).then((data) => setCounselorId(data.counselor?.id ?? null));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { plan } = await apiGetPlan(token);
      if (!plan) {
        setPlanStatus('none');
        return;
      }
      setPlanStatus(plan.status === 'approved' ? 'approved' : 'draft');
      if (plan.status === 'approved') {
        await refreshUser();
        router.replace('/');
      }
    };
    void load();
    const interval = setInterval(() => void load(), 15000);
    return () => clearInterval(interval);
  }, [token, refreshUser, router]);

  return (
    <Screen title="Your counselor is preparing your plan" subtitle="Submitted → Under review → Ready">
      <Card title="Status">
        <Text style={styles.line}>✓ Assessment submitted</Text>
        <Text style={styles.line}>
          {planStatus === 'draft' ? '◉ Under counselor review' : '✓ Under counselor review'}
        </Text>
        <Text style={planStatus === 'approved' ? styles.line : styles.muted}>
          {planStatus === 'approved' ? '✓ Plan ready' : '○ Plan ready'}
        </Text>
      </Card>
      <Button
        label="Message counselor"
        onPress={() =>
          counselorId
            ? router.push(`/(client)/messages/${counselorId}`)
            : router.push('/(client)/(tabs)/messages')
        }
      />
      <Button label="Review intake summary" variant="secondary" onPress={() => router.push('/(client)/intake')} />
    </Screen>
  );
}

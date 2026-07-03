import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiGetContacts, apiGetPlan } from '@/lib/api';

type PlanStatus = 'loading' | 'none' | 'draft' | 'approved';

export default function WaitingPlanScreen() {
  const router = useRouter();
  const { token, refreshUser } = useAuth();
  const [planStatus, setPlanStatus] = useState<PlanStatus>('loading');
  const styles = useThemedStyles((c) => ({
    line: { fontSize: 15, color: c.text, lineHeight: 24 },
    muted: { fontSize: 15, color: c.faint, lineHeight: 24 },
    active: { fontSize: 15, color: c.text, lineHeight: 24, fontWeight: '600' as const },
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

  const reviewLine =
    planStatus === 'none'
      ? '◉ Waiting for counselor to create your plan'
      : planStatus === 'draft'
        ? '◉ Under counselor review'
        : '✓ Under counselor review';

  const readyLine =
    planStatus === 'approved'
      ? '✓ Plan ready'
      : planStatus === 'draft'
        ? '○ Plan ready'
        : '○ Plan ready — not started yet';

  return (
    <Screen title="Your counselor is preparing your plan" subtitle="Submitted → Plan created → Approved → Ready">
      <Card title="Status">
        <Text style={styles.line}>✓ Assessment submitted</Text>
        <Text style={planStatus === 'none' ? styles.active : styles.line}>{reviewLine}</Text>
        <Text style={planStatus === 'approved' ? styles.line : styles.muted}>{readyLine}</Text>
        {planStatus === 'none' ? (
          <Text style={[styles.muted, { marginTop: 8 }]}>
            Your counselor will review your assessment and build your personalised program. You&apos;ll get a
            notification when it&apos;s ready.
          </Text>
        ) : null}
      </Card>
      {counselorId ? (
        <Button
          label="Message counselor"
          onPress={() => router.push(`/(client)/messages/${counselorId}`)}
        />
      ) : null}
      <Button label="Review intake summary" variant="secondary" onPress={() => router.push('/(client)/intake')} />
      <Button
        label="Profile & settings"
        variant="secondary"
        onPress={() => router.push('/(client)/profile')}
      />
    </Screen>
  );
}

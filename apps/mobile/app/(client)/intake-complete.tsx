import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { apiGetClinicEnrollment, apiGetOutcomeMeasures } from '@/lib/api';

export default function IntakeCompleteScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [showInstruments, setShowInstruments] = useState(false);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const { enrollment } = await apiGetClinicEnrollment(token);
        if (!enrollment || !enrollment.consentSharedWithClinic) return;
        const { measures } = await apiGetOutcomeMeasures(token);
        const hasBaseline = measures.some((m) => m.phase === 'baseline');
        if (!hasBaseline) setShowInstruments(true);
      } catch {
        // optional — never block onboarding
      }
    })();
  }, [token]);

  return (
    <Screen title="You're in. Your journey starts here." subtitle="Your counselor will review what you've shared and prepare your personalised program.">
      <Text style={styles.body}>This usually takes less than 24 hours. You'll get a message when your plan is ready.</Text>

      {showInstruments ? (
        <Card title="One quick step for your clinic">
          <Text style={styles.body}>
            A few short questionnaires now give your clinic a baseline to measure your progress against.
            Takes about 5 minutes.
          </Text>
          <Button
            label="Start questionnaires"
            onPress={() => router.push({ pathname: '/(client)/instruments', params: { phase: 'baseline' } })}
          />
        </Card>
      ) : null}

      <Button label="Go to messages" onPress={() => router.push('/(client)/(tabs)/messages')} />
      <Button label="What happens next?" variant="secondary" onPress={() => router.push('/(client)/waiting-plan')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, color: '#666', lineHeight: 22 },
});

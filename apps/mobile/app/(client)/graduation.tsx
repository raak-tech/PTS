import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiGetClinicEnrollment, apiGetOutcomeMeasures } from '@/lib/api';
import { spacing } from '@/theme';

export default function GraduationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();
  const [showInstruments, setShowInstruments] = useState(false);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const { enrollment } = await apiGetClinicEnrollment(token);
        if (!enrollment || !enrollment.consentSharedWithClinic) return;
        const { measures } = await apiGetOutcomeMeasures(token);
        if (!measures.some((m) => m.phase === 'week6')) setShowInstruments(true);
      } catch {
        // optional
      }
    })();
  }, [token]);
  const styles = useThemedStyles((c) => ({
    checkmark: { fontSize: 80, textAlign: 'center' as const, marginBottom: 20 },
    title: { fontSize: 26, fontWeight: '700' as const, color: c.text, textAlign: 'center' as const, marginBottom: 12 },
    subtitle: { fontSize: 16, color: c.muted, textAlign: 'center' as const, lineHeight: 24, marginBottom: 24 },
    sectionLabel: { fontSize: 13, fontWeight: '700' as const, color: c.faint, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 8 },
    body: { fontSize: 14, color: c.muted, lineHeight: 22 },
  }));

  return (
    <Screen title="Congratulations" subtitle="">
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.title}>You've completed your 6-week program</Text>
      <Text style={styles.subtitle}>
        You've taken meaningful steps toward managing your pain and building lasting recovery habits.
      </Text>

      <Card title="What you accomplished">
        <Text style={styles.body}>
          • Completed 6 weeks of personalized recovery exercises
          • Built awareness of your pain patterns and triggers
          • Learned evidence-based pain management techniques
          • Developed sustainable daily practices for ongoing wellness
        </Text>
      </Card>

      <View style={{ marginBottom: spacing.md }}>
        <Text style={styles.sectionLabel}>What's next</Text>
        <Card>
          <Text style={styles.body}>
            Your recovery doesn't end here. Moving into <Text style={{ fontWeight: '600' }}>maintenance mode</Text>, you'll:
          </Text>
          <Text style={[styles.body, { marginTop: 12 }]}>
            • Check in monthly with your counselor
          </Text>
          <Text style={[styles.body, { marginTop: 8 }]}>
            • Maintain your daily practices at a comfortable pace
          </Text>
          <Text style={[styles.body, { marginTop: 8 }]}>
            • Have your maintenance plan available anytime
          </Text>
        </Card>
      </View>

      {showInstruments ? (
        <Card title="One last step for your clinic">
          <Text style={styles.body}>
            The same short questionnaires from the start — completing them now shows how far you&apos;ve
            come. About 5 minutes.
          </Text>
          <Button
            label="Complete final questionnaires"
            onPress={() => router.push({ pathname: '/(client)/instruments', params: { phase: 'week6' } })}
          />
        </Card>
      ) : null}

      <Button
        label="View your maintenance plan"
        onPress={() => router.replace('/(client)/(tabs)/program')}
      />
    </Screen>
  );
}

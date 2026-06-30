import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

export default function GraduationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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

      <Button
        label="View your maintenance plan"
        onPress={() => router.replace('/(client)/(tabs)/program')}
      />
    </Screen>
  );
}

import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

const RED_FLAGS = [
  'Severe or sudden new weakness in arms or legs',
  'Loss of bladder or bowel control',
  'Fever alongside severe pain',
  'Pain after major trauma in the last 48 hours',
];

export default function SafetyContent() {
  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.sm },
    heading: { fontSize: 16, fontWeight: '700' as const, color: c.text },
    body: { fontSize: 15, color: c.muted, lineHeight: 22 },
    bullet: { fontSize: 14, color: c.muted, lineHeight: 22 },
  }));

  return (
    <Screen title="Safety guidelines" subtitle="PTS is not for emergencies.">
      <View style={styles.section}>
        <Text style={styles.heading}>Crisis lines</Text>
        <Text style={styles.body}>iCall 9152987821 · Aasra 9820466726</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>Red flags</Text>
        {RED_FLAGS.map((item) => (
          <Text key={item} style={styles.bullet}>• {item}</Text>
        ))}
      </View>
    </Screen>
  );
}

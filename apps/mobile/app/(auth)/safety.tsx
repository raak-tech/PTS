import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

const RED_FLAGS = [
  'Severe or sudden new weakness in arms or legs',
  'Loss of bladder or bowel control',
  'Fever alongside severe pain',
  'Pain after major trauma in the last 48 hours',
  'Numbness in inner thighs or groin',
  'Unexplained significant weight loss',
];

export default function SafetyScreen() {
  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.sm },
    heading: { fontSize: 16, fontWeight: '700' as const, color: c.text },
    body: { fontSize: 15, color: c.muted, lineHeight: 22 },
    bullet: { fontSize: 14, color: c.muted, lineHeight: 22 },
  }));

  return (
    <Screen title="Safety guidelines" subtitle="PTS is counseling support — not medical advice and not for emergencies.">
      <View style={styles.section}>
        <Text style={styles.heading}>If you need urgent help</Text>
        <Text style={styles.body}>Contact local emergency services or a crisis helpline (iCall 9152987821, Aasra 9820466726).</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>Red flag symptoms</Text>
        {RED_FLAGS.map((item) => (
          <Text key={item} style={styles.bullet}>• {item}</Text>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>What to do</Text>
        <Text style={styles.body}>Pause the program and seek in-person medical evaluation. Do not use this app for emergency triage.</Text>
      </View>
    </Screen>
  );
}

import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const STEPS = [
  'Pause and reduce load. Stop anything that feels unsafe or sharply increases symptoms.',
  'Take 60–120 seconds to breathe slowly. If breathing makes you dizzy or worse, stop.',
  'Choose the smallest next step: rest, a short gentle walk, or basic self-care. Keep intensity low.',
  'Note what changed (sleep, stress, activity, posture). This helps spot patterns with your counselor.',
];

export default function FlareUpScreen() {
  const styles = useThemedStyles((c) => ({
    body: { fontSize: 15, color: c.muted, lineHeight: 22 },
    step: { fontSize: 15, color: c.text, lineHeight: 22, marginBottom: 10 },
    alert: { fontSize: 14, color: c.danger, lineHeight: 22, marginTop: 16 },
  }));

  return (
    <Screen title="Flare-up support" subtitle="When pain spikes">
      <Text style={styles.body}>
        This is a safe reset checklist — not diagnosis or treatment. Contact your counselor if you need support.
      </Text>
      <View style={{ marginTop: 12 }}>
        {STEPS.map((step, i) => (
          <Text key={step} style={styles.step}>
            {i + 1}. {step}
          </Text>
        ))}
      </View>
      <Text style={styles.alert}>
        Seek urgent medical care for red-flag symptoms: new severe weakness, loss of bladder/bowel control, fever with
        severe back pain, major trauma, or unexplained weight loss.
      </Text>
    </Screen>
  );
}

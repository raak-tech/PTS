import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { HitTarget } from '@/components/HitTarget';
import { Screen } from '@/components/Screen';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

const SEGMENTS = [
  { key: 'pain', emoji: '🩹', label: 'Pain', hint: 'What hurts, how long, what changed?' },
  { key: 'sleep', emoji: '😴', label: 'Sleep', hint: 'Trouble falling asleep, staying asleep, or waking up tired?' },
  { key: 'anxiety', emoji: '😰', label: 'Anxiety / Stress', hint: 'Racing thoughts, worry, tension, what weighs on you?' },
  { key: 'injury_recovery', emoji: '🏃', label: 'Recovery after injury', hint: 'What happened, what are you working to get back?' },
  { key: 'other', emoji: '🔄', label: 'Something else', hint: 'Tell us in your own words — no wrong answer.' },
];

export default function SegmentScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const styles = useThemedStyles((c) => ({
    card: { backgroundColor: c.surface, borderRadius: 14, borderWidth: 2, borderColor: c.border, padding: spacing.lg, gap: spacing.sm },
    cardSelected: { borderColor: c.accent, backgroundColor: c.successBg },
    emoji: { fontSize: 28 },
    label: { fontSize: 16, fontWeight: '700' as const, color: c.text },
    hint: { fontSize: 13, color: c.muted, lineHeight: 19 },
    skip: { textAlign: 'center' as const, marginTop: spacing.lg },
    skipText: { fontSize: 14, color: c.muted },
  }));

  const handleContinue = () => {
    router.push({ pathname: '/(client)/intake/onebox', params: { segmentType: selected ?? undefined } });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen title="I'm here for help with..." subtitle="Choose what fits best. You can skip this.">
      <View style={{ gap: spacing.md }}>
        {SEGMENTS.map((seg) => (
          <HitTarget
            key={seg.key}
            style={[styles.card, selected === seg.key && styles.cardSelected]}
            onPress={() => setSelected(seg.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === seg.key }}
          >
            <Text style={styles.emoji}>{seg.emoji}</Text>
            <Text style={styles.label}>{seg.label}</Text>
            <Text style={styles.hint}>{seg.hint}</Text>
          </HitTarget>
        ))}
        <Button label="Continue" onPress={handleContinue} disabled={!selected} />
        <HitTarget style={styles.skip} onPress={() => router.push('/(client)/intake/onebox')}>
          <Text style={styles.skipText}>Skip — just let me type</Text>
        </HitTarget>
      </View>
    </Screen>
    </>
  );
}

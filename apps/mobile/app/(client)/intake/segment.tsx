import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { HitTarget } from '@/components/HitTarget';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { persistOneBoxDraft } from '@/lib/intake-draft-sync';
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
  const { token } = useAuth();
  const { segmentType: resumeSegment } = useLocalSearchParams<{ segmentType?: string }>();
  const [selected, setSelected] = useState<string | null>(resumeSegment ?? null);
  const selectedLabel = SEGMENTS.find((s) => s.key === selected)?.label;
  const styles = useThemedStyles((c) => ({
    card: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardSelected: { borderColor: c.accent, backgroundColor: c.successBg },
    emoji: { fontSize: 28 },
    label: { fontSize: 16, fontWeight: '700' as const, color: c.text },
    hint: { fontSize: 13, color: c.muted, lineHeight: 19 },
    footerHint: { fontSize: 13, color: c.muted, textAlign: 'center' as const, marginBottom: spacing.xs },
  }));

  useEffect(() => {
    if (resumeSegment) setSelected(resumeSegment);
  }, [resumeSegment]);

  const handleContinue = () => {
    if (!selected) return;
    void persistOneBoxDraft({ step: 'segment', segmentType: selected }, token);
    router.push({ pathname: '/(client)/intake/onebox', params: { segmentType: selected } });
  };

  const handleSkip = () => {
    void persistOneBoxDraft({ step: 'onebox', segmentType: 'other', freeText: '' }, token);
    router.push({ pathname: '/(client)/intake/onebox', params: { segmentType: 'other' } });
  };

  return (
    <Screen
      title="I'm here for help with..."
      subtitle="Choose what fits best. You can skip this."
      showAccountExit
      footer={
        <View style={{ gap: spacing.sm }}>
          {selected ? (
            <Text style={styles.footerHint}>Selected: {selectedLabel}</Text>
          ) : (
            <Text style={styles.footerHint}>Select a topic to continue</Text>
          )}
          <Button
            label={selectedLabel ? `Continue with ${selectedLabel}` : 'Continue'}
            onPress={handleContinue}
            disabled={!selected}
          />
          <Button label="Skip — just let me type" variant="ghost" onPress={handleSkip} />
        </View>
      }
    >
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
      </View>
    </Screen>
  );
}

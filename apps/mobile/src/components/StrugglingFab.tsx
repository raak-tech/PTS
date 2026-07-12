import { useRouter } from 'expo-router';
import { Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { HitTarget } from '@/components/HitTarget';
import { useCounselorContact } from '@/hooks/useClientData';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

function BreathingGuide({ onDone }: { onDone: () => void }) {
  const styles = useThemedStyles((c) => ({
    title: { fontSize: 18, fontWeight: '700' as const, color: c.text, marginBottom: spacing.sm },
    step: { fontSize: 16, color: c.muted, lineHeight: 26, marginBottom: spacing.md },
    done: {
      marginTop: spacing.md,
      textAlign: 'center' as const,
      fontSize: 15,
      fontWeight: '600' as const,
      color: c.primary,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Grounding breath (2 min)</Text>
      <Text style={styles.step}>1. Sit comfortably. Soften your shoulders.</Text>
      <Text style={styles.step}>2. Breathe in slowly for 4 counts.</Text>
      <Text style={styles.step}>3. Hold gently for 4 counts.</Text>
      <Text style={styles.step}>4. Breathe out for 6 counts. Repeat 5–8 times.</Text>
      <Text style={styles.step}>Notice your feet on the floor. You do not need to fix anything right now.</Text>
      <HitTarget onPress={onDone}>
        <Text style={styles.done}>I feel a bit steadier</Text>
      </HitTarget>
    </View>
  );
}

export function StrugglingFab() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'menu' | 'breathe'>('menu');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { counselorId } = useCounselorContact();
  const styles = useThemedStyles((c) => ({
    fab: {
      position: 'absolute' as const,
      right: spacing.lg,
      bottom: insets.bottom + 64,
      backgroundColor: c.accentWarm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 999,
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    fabText: { color: '#fff', fontSize: 14, fontWeight: '700' as const },
    overlay: { flex: 1, justifyContent: 'flex-end' as const, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      paddingBottom: spacing.lg + insets.bottom,
      gap: spacing.sm,
    },
    sheetTitle: { fontSize: 20, fontWeight: '800' as const, color: c.text, marginBottom: spacing.xs },
    option: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    optionText: { fontSize: 16, fontWeight: '600' as const, color: c.text },
    optionHint: { fontSize: 13, color: c.muted, marginTop: 4 },
    close: { marginTop: spacing.md, alignItems: 'center' as const, padding: spacing.sm },
    closeText: { fontSize: 15, color: c.muted, fontWeight: '600' as const },
  }));

  const close = () => {
    setOpen(false);
    setMode('menu');
  };

  const messageCounselor = () => {
    close();
    if (counselorId) {
      router.push(`/(client)/messages/${counselorId}`);
    } else {
      router.push('/(client)/(tabs)/messages');
    }
  };

  return (
    <>
      <HitTarget style={styles.fab} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="I'm struggling">
        <Text style={styles.fabText}>I&apos;m struggling</Text>
      </HitTarget>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {mode === 'menu' ? (
              <>
                <Text style={styles.sheetTitle}>Take a moment</Text>
                <HitTarget
                  style={styles.option}
                  onPress={() => {
                    close();
                    router.push('/(client)/profile/flare-up');
                  }}
                >
                  <Text style={styles.optionText}>Pain flare-up</Text>
                  <Text style={styles.optionHint}>Short guided support when pain spikes</Text>
                </HitTarget>
                <HitTarget style={styles.option} onPress={() => setMode('breathe')}>
                  <Text style={styles.optionText}>Grounding breath</Text>
                  <Text style={styles.optionHint}>2-minute pause — no outcome promised</Text>
                </HitTarget>
                {counselorId ? (
                  <HitTarget style={styles.option} onPress={messageCounselor}>
                    <Text style={styles.optionText}>Message counselor</Text>
                    <Text style={styles.optionHint}>Share what feels hard right now</Text>
                  </HitTarget>
                ) : null}
                <HitTarget
                  style={styles.option}
                  onPress={() => {
                    close();
                    router.push('/(client)/profile/safety');
                  }}
                >
                  <Text style={styles.optionText}>Crisis resources</Text>
                  <Text style={styles.optionHint}>Helplines if you need immediate support</Text>
                </HitTarget>
                <HitTarget style={styles.close} onPress={close}>
                  <Text style={styles.closeText}>Close</Text>
                </HitTarget>
              </>
            ) : (
              <>
                <BreathingGuide onDone={close} />
                <HitTarget style={styles.close} onPress={() => setMode('menu')}>
                  <Text style={styles.closeText}>Back</Text>
                </HitTarget>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

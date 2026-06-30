import { Linking, Modal, Platform, Text, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

import { HitTarget } from '@/components/HitTarget';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

function CrisisSheet({
  styles,
  onClose,
  onSafety,
}: {
  styles: {
    sheet: object;
    title: object;
    body: object;
    linkRow: object;
    link: object;
    closeBtn: object;
    closeText: object;
  };
  onClose: () => void;
  onSafety: () => void;
}) {
  return (
    <View style={styles.sheet}>
      <Text style={styles.title}>Crisis support</Text>
      <Text style={styles.body}>
        PTS is not for emergencies. If you are in immediate danger, call local emergency services.
      </Text>
      <HitTarget style={styles.linkRow} onPress={() => Linking.openURL('tel:9152987821')}>
        <Text style={styles.link}>iCall — 9152987821</Text>
      </HitTarget>
      <HitTarget style={styles.linkRow} onPress={() => Linking.openURL('tel:9820466726')}>
        <Text style={styles.link}>Aasra — 9820466726</Text>
      </HitTarget>
      <HitTarget style={styles.linkRow} onPress={() => Linking.openURL('https://findahelpline.com')}>
        <Text style={styles.link}>Global helplines</Text>
      </HitTarget>
      <HitTarget style={styles.linkRow} onPress={onSafety}>
        <Text style={styles.link}>Safety guidelines</Text>
      </HitTarget>
      <HitTarget style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeText}>Close</Text>
      </HitTarget>
    </View>
  );
}

export function CrisisBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const styles = useThemedStyles((c) => ({
    bar: { backgroundColor: c.crisisBar, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    barText: { color: c.crisisBarText, fontSize: 13, textAlign: 'center' as const },
    bold: { color: c.accent, fontWeight: '700' as const },
    overlay: { flex: 1, justifyContent: 'flex-end' as const, backgroundColor: 'rgba(0,0,0,0.45)' },
    webOverlay: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 1000,
      justifyContent: 'flex-end' as const,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
    },
    title: { fontSize: 20, fontWeight: '800' as const, color: c.text, marginBottom: spacing.sm },
    body: { fontSize: 15, color: c.muted, lineHeight: 22, marginBottom: spacing.md },
    linkRow: { paddingVertical: spacing.sm },
    link: { fontSize: 16, fontWeight: '600' as const, color: c.text },
    closeBtn: { marginTop: spacing.md, alignItems: 'center' as const, padding: spacing.sm },
    closeText: { fontSize: 15, color: c.muted, fontWeight: '600' as const },
  }));

  const close = () => setOpen(false);
  const openSafety = () => {
    setOpen(false);
    router.push('/(auth)/safety');
  };

  return (
    <>
      <HitTarget style={styles.bar} onPress={() => setOpen(true)} accessibilityRole="button">
        <Text style={styles.barText}>
          <Text style={styles.bold}>Need help now?</Text> Tap for crisis resources
        </Text>
      </HitTarget>

      {open && Platform.OS === 'web' ? (
        <View style={styles.webOverlay} accessibilityViewIsModal>
          <HitTarget style={{ flex: 1 }} onPress={close}>
            <View />
          </HitTarget>
          <CrisisSheet styles={styles as never} onClose={close} onSafety={openSafety} />
        </View>
      ) : null}

      {open && Platform.OS !== 'web' ? (
        <Modal visible animationType="slide" transparent onRequestClose={close}>
          <View style={styles.overlay}>
            <CrisisSheet styles={styles as never} onClose={close} onSafety={openSafety} />
          </View>
        </Modal>
      ) : null}
    </>
  );
}

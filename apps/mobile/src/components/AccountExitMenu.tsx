import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { HitTarget } from '@/components/HitTarget';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

type Props = {
  /** Compact header control vs footer link. */
  compact?: boolean;
};

/**
 * Quiet Account escape for incomplete-intake / waiting-plan shells.
 * Sign out (pause) and Delete account (permanent) stay separate.
 */
export function AccountExitMenu({ compact = true }: Props) {
  const router = useRouter();
  const { signOut, deleteAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const styles = useThemedStyles((c) => ({
    trigger: {
      paddingVertical: compact ? 6 : 10,
      paddingHorizontal: compact ? 8 : 12,
      minHeight: 44,
      justifyContent: 'center' as const,
    },
    triggerLabel: {
      fontSize: compact ? 14 : 15,
      fontWeight: '600' as const,
      color: c.muted,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end' as const,
    },
    dismissArea: { flex: 1 },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    title: { fontSize: 18, fontWeight: '700' as const, color: c.text },
    body: { fontSize: 14, color: c.muted, lineHeight: 20 },
    dangerLabel: { color: c.danger, fontWeight: '600' as const, fontSize: 15 },
    dangerBtn: {
      minHeight: 48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingVertical: 12,
    },
  }));

  const onSignOut = () => {
    setOpen(false);
    Alert.alert(
      'Sign out?',
      'You can sign back in with the same phone to continue your draft.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await signOut();
                router.replace('/(auth)/login');
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  const runDelete = () => {
    void (async () => {
      setBusy(true);
      try {
        await deleteAccount();
        router.replace('/(auth)/login');
      } catch {
        Alert.alert('Could not delete account', 'Please try again in a moment.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const onDelete = () => {
    setOpen(false);
    Alert.alert(
      'Delete account?',
      'This permanently removes your account and any intake draft. You cannot undo this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirm deletion', 'Are you sure you want to delete your account?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Yes, delete', style: 'destructive', onPress: runDelete },
            ]);
          },
        },
      ],
    );
  };

  return (
    <>
      <HitTarget
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Account options"
        disabled={busy}
      >
        {busy ? <ActivityIndicator size="small" /> : <Text style={styles.triggerLabel}>Account</Text>}
      </HitTarget>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.dismissArea} onPress={() => setOpen(false)} accessibilityLabel="Dismiss" />
          <View style={styles.sheet}>
            <Text style={styles.title}>Account</Text>
            <Text style={styles.body}>
              Sign out to pause and come back later. Delete account removes your data permanently.
            </Text>
            <Button label="Sign out" onPress={onSignOut} />
            <HitTarget style={styles.dangerBtn} onPress={onDelete} accessibilityRole="button">
              <Text style={styles.dangerLabel}>Delete account</Text>
            </HitTarget>
            <Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

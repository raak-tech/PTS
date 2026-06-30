import { Modal, Text, View } from 'react-native';

import { HitTarget } from '@/components/HitTarget';
import { USE_MOCK_AUTH } from '@/config';
import { MOCK_ACCOUNTS } from '@/mock/data';
import { useAuth } from '@/context/AuthContext';
import { useProgramTime } from '@/hooks/useProgramTime';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function DevMenu({ visible, onClose }: Props) {
  const { devSignInAs, resetProgramClock, user } = useAuth();
  const programTime = useProgramTime();
  const styles = useThemedStyles((c) => ({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' as const, padding: spacing.lg },
    sheet: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.sm,
      maxHeight: '90%' as const,
    },
    title: { fontSize: 18, fontWeight: '800' as const, color: c.text },
    section: { fontSize: 14, fontWeight: '700' as const, color: c.text, marginTop: spacing.sm },
    hint: { fontSize: 13, color: c.muted },
    clock: { fontSize: 12, color: c.text, lineHeight: 18 },
    row: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: c.border },
    rowTitle: { fontSize: 15, fontWeight: '700' as const, color: c.text },
    rowMeta: { fontSize: 13, color: c.muted, marginTop: 2 },
    close: { alignItems: 'center' as const, paddingTop: spacing.md },
    closeText: { color: c.muted, fontWeight: '600' as const },
  }));

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Dev menu</Text>
          <Text style={styles.hint}>
            {USE_MOCK_AUTH
              ? 'Mock auth — OTP is 123456 for all test numbers'
              : 'Live API — use admin-created accounts and SMS OTP'}
          </Text>

          {USE_MOCK_AUTH ? (
            <>
              <Text style={styles.section}>Quick sign-in</Text>
              {programTime ? (
                <Text style={styles.clock}>
                  Active client clock: {programTime.subtitle}
                  {programTime.programComplete
                    ? ' (complete)'
                    : ` · next week in ${Math.ceil(programTime.msUntilNextWeek / 60_000)}m`}
                </Text>
              ) : null}
              <Text style={styles.hint}>Test clock: 1 real hour = 1 program week</Text>

              {MOCK_ACCOUNTS.map((account) => (
                <HitTarget
                  key={account.id}
                  style={styles.row}
                  onPress={async () => {
                    await devSignInAs(account);
                    onClose();
                  }}
                >
                  <Text style={styles.rowTitle}>{account.displayName}</Text>
                  <Text style={styles.rowMeta}>
                    {account.role} · {account.phone.replace('+91', '')}
                  </Text>
                </HitTarget>
              ))}
            </>
          ) : null}

          {user?.planApproved ? (
            <HitTarget
              style={styles.row}
              onPress={async () => {
                await resetProgramClock();
              }}
            >
              <Text style={styles.rowTitle}>Reset program clock</Text>
              <Text style={styles.rowMeta}>Back to Week 1 Day 1 (now)</Text>
            </HitTarget>
          ) : null}

          <HitTarget onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </HitTarget>
        </View>
      </View>
    </Modal>
  );
}

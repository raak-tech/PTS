import { Pressable, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useProgramTime } from '@/hooks/useProgramTime';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

export function TestTimeBanner() {
  const { user, resetProgramClock } = useAuth();
  const programTime = useProgramTime();
  const styles = useThemedStyles((c) => ({
    wrap: {
      backgroundColor: c.accent + '22',
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 2,
    },
    text: { fontSize: 12, fontWeight: '700' as const, color: c.text },
    meta: { fontSize: 12, color: c.muted },
    reset: { fontSize: 12, color: c.accentDark, textDecorationLine: 'underline' as const, marginTop: 2 },
  }));

  if (!user?.planApproved || !programTime) return null;
  if (!__DEV__) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        {programTime.programComplete
          ? programTime.usesCalendarWeeks
            ? 'Program complete (6 calendar weeks)'
            : 'Test time: program complete (6 weeks elapsed)'
          : programTime.testModeLabel}
      </Text>
      <Text style={styles.meta}>{programTime.subtitle}</Text>
      <Pressable onPress={resetProgramClock}>
        <Text style={styles.reset}>
          {programTime.usesCalendarWeeks ? 'Refresh program state' : 'Reset to Week 1 Day 1'}
        </Text>
      </Pressable>
    </View>
  );
}

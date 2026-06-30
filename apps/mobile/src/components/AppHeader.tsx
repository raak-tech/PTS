import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function AppHeader({ title, subtitle, right }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((c) => ({
    wrap: {
      paddingTop: insets.top + spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      flexDirection: 'row' as const,
      alignItems: 'flex-end' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.md,
    },
    textBlock: { flex: 1 },
    title: { fontSize: 22, fontWeight: '700' as const, color: c.text, letterSpacing: -0.3 },
    subtitle: { fontSize: 14, color: c.muted, marginTop: 4, lineHeight: 20 },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.textBlock}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

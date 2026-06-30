import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { HitTarget } from '@/components/HitTarget';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

type Props = {
  title?: string;
  children: ReactNode;
  onPress?: () => void;
  alert?: boolean;
};

export function Card({ title, children, onPress, alert }: Props) {
  const styles = useThemedStyles((c) => ({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    alert: { backgroundColor: c.dangerBg, borderColor: '#ef9a9a' },
    title: { fontSize: 15, fontWeight: '700' as const, color: c.text },
    alertTitle: { color: c.danger },
    pressed: { opacity: 0.85 },
  }));

  const content = (
    <View style={[styles.card, alert && styles.alert]}>
      {title ? <Text style={[styles.title, alert && styles.alertTitle]}>{title}</Text> : null}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <HitTarget onPress={onPress} style={({ pressed }: { pressed: boolean }) => [pressed && styles.pressed]}>
        {content}
      </HitTarget>
    );
  }

  return content;
}

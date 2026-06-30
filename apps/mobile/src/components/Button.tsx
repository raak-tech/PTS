import { ActivityIndicator, Text, TextStyle, ViewStyle } from 'react-native';

import { HitTarget } from '@/components/HitTarget';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    base: {
      borderRadius: 999,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 48,
    },
    primary: { backgroundColor: c.primary },
    secondary: { backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.border },
    ghost: { backgroundColor: 'transparent' },
    disabled: { opacity: 0.5 },
    label: { color: c.onPrimary, fontSize: 16, fontWeight: '700' as const },
    labelDark: { color: c.text },
    labelGhost: { fontWeight: '600' as const },
  }));

  const buttonStyle: ViewStyle[] = [styles.base];
  const textStyle: TextStyle[] = [styles.label];

  if (variant === 'primary') buttonStyle.push(styles.primary);
  if (variant === 'secondary') buttonStyle.push(styles.secondary);
  if (variant === 'ghost') buttonStyle.push(styles.ghost);
  if (disabled || loading) buttonStyle.push(styles.disabled);

  if (variant === 'secondary' || variant === 'ghost') textStyle.push(styles.labelDark);
  if (variant === 'ghost') textStyle.push(styles.labelGhost);

  return (
    <HitTarget style={buttonStyle} onPress={onPress} disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.text} />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </HitTarget>
  );
}

import { Image, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

type Props = {
  size?: 'sm' | 'lg';
  onDark?: boolean;
};

export function BrandMark({ size = 'lg', onDark = false }: Props) {
  const styles = useThemedStyles((c) => ({
    wrap: { alignItems: 'center' as const, gap: spacing.sm, marginBottom: size === 'lg' ? spacing.lg : spacing.sm },
    logo: {
      width: size === 'lg' ? 72 : 48,
      height: size === 'lg' ? 72 : 48,
      borderRadius: size === 'lg' ? 18 : 12,
    },
    title: {
      fontSize: size === 'lg' ? 26 : 20,
      fontWeight: '800' as const,
      color: onDark ? '#FFFCF7' : c.text,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: 14,
      color: onDark ? 'rgba(255,252,247,0.85)' : c.muted,
      textAlign: 'center' as const,
      lineHeight: 20,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Image source={require('../../assets/splash-icon.png')} style={styles.logo} accessibilityLabel="PTS logo" />
      <Text style={styles.title}>Pain to Strength</Text>
      {size === 'lg' ? <Text style={styles.tagline}>Counselor-led recovery support</Text> : null}
    </View>
  );
}

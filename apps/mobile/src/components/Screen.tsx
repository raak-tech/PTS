import { ReactNode } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { CrisisBar } from '@/components/CrisisBar';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  showCrisis?: boolean;
  /** Tab screens use a compact native header; stack/auth screens use in-content titles. */
  layout?: 'tab' | 'stack';
  headerRight?: ReactNode;
};

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  showCrisis = true,
  layout = 'stack',
  headerRight,
}: Props) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((c) => ({
    safe: { flex: 1, backgroundColor: c.bg },
    scroll: { paddingBottom: spacing.xl + insets.bottom },
    inner: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
    innerStatic: Platform.OS === 'web' ? { minHeight: '100%' as const } : { flex: 1 },
    title: { fontSize: 28, fontWeight: '800' as const, color: c.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: c.muted, lineHeight: 24, marginTop: -spacing.xs },
  }));

  const body = (
    <View style={[styles.inner, !scroll && styles.innerStatic]}>
      {layout === 'stack' && title ? <Text style={styles.title}>{title}</Text> : null}
      {layout === 'stack' && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );

  return (
    <View style={styles.safe}>
      {showCrisis ? <CrisisBar /> : null}
      {layout === 'tab' && title ? <AppHeader title={title} subtitle={subtitle} right={headerRight} /> : null}
      {scroll ? (
        <ScrollView
          style={Platform.OS === 'web' ? { flex: 1 } : undefined}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

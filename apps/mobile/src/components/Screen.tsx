import { ReactNode, useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { CrisisBar } from '@/components/CrisisBar';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

/** Approximate CrisisBar tap target height (padding + one line). */
const CRISIS_BAR_HEIGHT = 40;

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  showCrisis?: boolean;
  /** Tab screens use a compact native header; stack/auth screens use in-content titles. */
  layout?: 'tab' | 'stack';
  headerRight?: ReactNode;
  /** Pinned above the keyboard — use for submit bars and message composers. */
  footer?: ReactNode;
  /** Scroll to bottom when the keyboard opens (helpful for long forms). */
  scrollToEndOnKeyboard?: boolean;
};

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  showCrisis = true,
  layout = 'stack',
  headerRight,
  footer,
  scrollToEndOnKeyboard = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);

  const styles = useThemedStyles((c) => ({
    safe: { flex: 1, backgroundColor: c.bg },
    avoid: { flex: 1 },
    scroll: {
      paddingBottom: spacing.md + insets.bottom + (footer ? 0 : keyboardHeight),
    },
    inner: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
    innerFlex: { flex: 1 },
    title: { fontSize: 28, fontWeight: '800' as const, color: c.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: c.muted, lineHeight: 24, marginTop: -spacing.xs },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: Math.max(insets.bottom, spacing.sm),
      borderTopWidth: footer ? 1 : 0,
      borderTopColor: c.border,
      backgroundColor: c.bg,
    },
  }));

  const keyboardVerticalOffset =
    Platform.OS === 'ios'
      ? insets.top + (showCrisis ? CRISIS_BAR_HEIGHT : 0)
      : 0;

  useEffect(() => {
    if (!scrollToEndOnKeyboard || keyboardHeight <= 0) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [keyboardHeight, scrollToEndOnKeyboard]);

  const headerBlock =
    layout === 'stack' ? (
      <>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </>
    ) : null;

  const usesFlexBody = !scroll || Boolean(footer);

  const scrollBody = (
    <View style={[styles.inner, usesFlexBody && styles.innerFlex]}>
      {headerBlock}
      {children}
    </View>
  );

  const mainContent =
    scroll && !footer ? (
      <ScrollView
        ref={scrollRef}
        style={Platform.OS === 'web' ? { flex: 1 } : { flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {scrollBody}
      </ScrollView>
    ) : scroll && footer ? (
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {scrollBody}
      </ScrollView>
    ) : (
      <View style={{ flex: 1 }}>{scrollBody}</View>
    );

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.avoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {showCrisis ? <CrisisBar /> : null}
        {layout === 'tab' && title ? (
          <AppHeader title={title} subtitle={subtitle} right={headerRight} />
        ) : null}
        {mainContent}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </View>
  );
}

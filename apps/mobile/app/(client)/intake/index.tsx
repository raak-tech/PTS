import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  draftToResumeTarget,
  hasOneBoxDraftProgress,
  stepLabel,
  type OneBoxIntakeDraft,
} from '@/lib/intake-draft';
import {
  clearOneBoxDraftEverywhere,
  resolveOneBoxDraft,
} from '@/lib/intake-draft-sync';
import { spacing } from '@/theme';

/**
 * Entry for `/(client)/intake`. Resumes one-box draft when present;
 * otherwise starts at segment. Legacy form is opt-in only.
 */
export default function IntakeIndex() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors } = useTheme();
  const prompted = useRef(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<OneBoxIntakeDraft | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_USE_LEGACY_INTAKE === 'true') return;
    if (prompted.current) return;
    prompted.current = true;

    void (async () => {
      const resolved = await resolveOneBoxDraft(token);
      if (hasOneBoxDraftProgress(resolved)) {
        setDraft(resolved);
        setShowModal(true);
        setLoading(false);
        return;
      }
      setLoading(false);
      router.replace('/(client)/intake/segment');
    })();
  }, [router, token]);

  if (process.env.EXPO_PUBLIC_USE_LEGACY_INTAKE === 'true') {
    return <Redirect href="/(client)/intake/legacy" />;
  }

  const onContinue = () => {
    if (!draft) return;
    setShowModal(false);
    const target = draftToResumeTarget(draft);
    router.replace({ pathname: target.pathname, params: target.params });
  };

  const onStartOver = async () => {
    setShowModal(false);
    await clearOneBoxDraftEverywhere(token);
    setDraft(null);
    router.replace('/(client)/intake/segment');
  };

  if (loading || showModal) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Screen title="Welcome back" subtitle="Checking your progress…" showCrisis showAccountExit>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : null}
        </Screen>
        <Modal visible={showModal} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: spacing.lg,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: spacing.lg,
                maxWidth: 340,
                width: '100%',
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Continue where you left off?
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.muted,
                  marginBottom: 16,
                  lineHeight: 20,
                }}
              >
                You were {draft ? stepLabel(draft.step) : 'in intake'}. You can
                pick up there or start fresh.
              </Text>
              <View style={{ gap: spacing.sm }}>
                <Button label="Continue where I left off" onPress={onContinue} />
                <Button label="Start over" variant="secondary" onPress={onStartOver} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

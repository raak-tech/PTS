/**
 * Legacy multi-step intake form. Only reached when
 * EXPO_PUBLIC_USE_LEGACY_INTAKE=true (via intake/index redirect).
 */
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CrisisBar } from '@/components/CrisisBar';
import { IntakeStepContent } from '@/components/intake/IntakeStepContent';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useIntakeDraft } from '@/hooks/useIntakeDraft';
import {
  canAdvanceIntake,
  emptyIntake,
  hasIntakeDraftProgress,
  INTAKE_STEPS,
  type IntakeDraft,
  type IntakeFormData,
} from '@/lib/intake';
import { spacing } from '@/theme';

export default function LegacyIntakeScreen() {
  const router = useRouter();
  const { completeIntake } = useAuth();
  const { colors } = useTheme();
  const draftStorage = useIntakeDraft();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeFormData>(emptyIntake);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAbandonmentModal, setShowAbandonmentModal] = useState(false);
  const [savedDraft, setSavedDraft] = useState<IntakeDraft | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const resumePromptedRef = useRef(false);
  const styles = useThemedStyles((c) => ({
    progressTrack: { height: 4, backgroundColor: c.border },
    progressFill: { height: 4, backgroundColor: c.accent },
    stepLabel: { fontSize: 13, color: c.faint, fontWeight: '600' as const },
    row: { gap: spacing.sm },
    error: { color: c.danger, fontSize: 14 },
  }));

  useEffect(() => {
    if (resumePromptedRef.current) return;
    resumePromptedRef.current = true;

    void (async () => {
      const draft = await draftStorage.loadDraft();
      if (!draft || !hasIntakeDraftProgress(draft)) {
        if (draft) await draftStorage.clearDraft();
        return;
      }
      startedAtRef.current = draft.startedAt;
      setSavedDraft(draft);
      setShowAbandonmentModal(true);
    })();
  }, [draftStorage.clearDraft, draftStorage.loadDraft]);

  const current = INTAKE_STEPS[step];
  const progress = ((step + 1) / INTAKE_STEPS.length) * 100;
  const canAdvance = canAdvanceIntake(step, data);

  const set = (partial: Partial<IntakeFormData>) => {
    const newData = { ...data, ...partial };
    setData(newData);
    if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
    const draft: IntakeDraft = {
      data: newData,
      step,
      startedAt: startedAtRef.current,
    };
    if (hasIntakeDraftProgress(draft)) {
      void draftStorage.saveDraft(draft);
    }
  };

  const onNext = async () => {
    if (step < INTAKE_STEPS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
      const draft: IntakeDraft = { data, step: nextStep, startedAt: startedAtRef.current };
      if (hasIntakeDraftProgress(draft)) void draftStorage.saveDraft(draft);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await completeIntake(data);
      await draftStorage.clearDraft();
      if (data.hasRedFlags || !data.isSafe) {
        router.replace('/(auth)/safety');
        return;
      }
      router.replace('/(client)/intake-complete');
    } catch {
      setError('Could not submit assessment. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const daysSince = (isoString: string): number => {
    const started = new Date(isoString).getTime();
    const now = new Date().getTime();
    return Math.floor((now - started) / (1000 * 60 * 60 * 24));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <CrisisBar />

      <Modal visible={showAbandonmentModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, maxWidth: 340 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
              Resume your assessment?
            </Text>
            {savedDraft && (
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16, lineHeight: 20 }}>
                Step {savedDraft.step + 1} of {INTAKE_STEPS.length} — started {daysSince(savedDraft.startedAt)} day
                {daysSince(savedDraft.startedAt) !== 1 ? 's' : ''} ago.
              </Text>
            )}
            <View style={{ gap: spacing.sm }}>
              <Button
                label="Continue where I left off"
                onPress={() => {
                  if (savedDraft) {
                    setStep(savedDraft.step);
                    setData(savedDraft.data);
                    startedAtRef.current = savedDraft.startedAt;
                  }
                  setShowAbandonmentModal(false);
                }}
              />
              <Button
                label="Start over"
                variant="secondary"
                onPress={async () => {
                  await draftStorage.clearDraft();
                  startedAtRef.current = null;
                  setSavedDraft(null);
                  setStep(0);
                  setData(emptyIntake);
                  setShowAbandonmentModal(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Screen title={current.title} subtitle={current.subtitle} showCrisis={false} showAccountExit>
        <Text style={styles.stepLabel}>
          Step {step + 1} of {INTAKE_STEPS.length}
        </Text>
        <IntakeStepContent step={step} data={data} set={set} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.row}>
          {step > 0 ? <Button label="Back" variant="secondary" onPress={() => setStep((s) => s - 1)} /> : null}
          <Button
            label={step === INTAKE_STEPS.length - 1 ? 'Submit assessment' : 'Continue'}
            onPress={onNext}
            loading={loading}
            disabled={!canAdvance}
          />
        </View>
      </Screen>
    </View>
  );
}

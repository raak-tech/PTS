import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CrisisBar } from '@/components/CrisisBar';
import { IntakeStepContent } from '@/components/intake/IntakeStepContent';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useIntakeDraft } from '@/hooks/useIntakeDraft';
import { canAdvanceIntake, emptyIntake, INTAKE_STEPS, type IntakeFormData } from '@/lib/intake';
import { spacing } from '@/theme';

export default function IntakeScreen() {
  const router = useRouter();
  const { completeIntake } = useAuth();
  const { colors } = useTheme();
  const draftStorage = useIntakeDraft();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeFormData>(emptyIntake);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAbandonmentModal, setShowAbandonmentModal] = useState(false);
  const [draftInfo, setDraftInfo] = useState<{ step: number; startedAt: string } | null>(null);
  const styles = useThemedStyles((c) => ({
    progressTrack: { height: 4, backgroundColor: c.border },
    progressFill: { height: 4, backgroundColor: c.accent },
    stepLabel: { fontSize: 13, color: c.faint, fontWeight: '600' as const },
    row: { gap: spacing.sm },
    error: { color: c.danger, fontSize: 14 },
  }));

  useEffect(() => {
    const checkDraft = async () => {
      const draft = await draftStorage.loadDraft();
      if (draft) {
        setDraftInfo({ step: draft.step, startedAt: draft.startedAt });
        setShowAbandonmentModal(true);
      }
    };
    checkDraft();
  }, [draftStorage]);

  const current = INTAKE_STEPS[step];
  const progress = ((step + 1) / INTAKE_STEPS.length) * 100;
  const canAdvance = canAdvanceIntake(step, data);

  const set = (partial: Partial<IntakeFormData>) => {
    const newData = { ...data, ...partial };
    setData(newData);
    // Auto-save draft
    draftStorage.saveDraft({ data: newData, step, startedAt: draftInfo?.startedAt ?? new Date().toISOString() });
  };

  const onNext = async () => {
    if (step < INTAKE_STEPS.length - 1) {
      setStep((s) => s + 1);
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

      {/* Abandonment modal */}
      <Modal visible={showAbandonmentModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, maxWidth: 340 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
              Resume your assessment?
            </Text>
            {draftInfo && (
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16, lineHeight: 20 }}>
                Step {draftInfo.step + 1} of {INTAKE_STEPS.length} — started {daysSince(draftInfo.startedAt)} day{daysSince(draftInfo.startedAt) !== 1 ? 's' : ''} ago.
              </Text>
            )}
            <View style={{ gap: spacing.sm }}>
              <Button
                label="Continue where I left off"
                onPress={() => {
                  if (draftInfo) setStep(draftInfo.step);
                  setShowAbandonmentModal(false);
                }}
              />
              <Button
                label="Start over"
                variant="secondary"
                onPress={async () => {
                  await draftStorage.clearDraft();
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
      <Screen title={current.title} subtitle={current.subtitle} showCrisis={false}>
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

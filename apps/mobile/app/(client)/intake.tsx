import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CrisisBar } from '@/components/CrisisBar';
import { IntakeStepContent } from '@/components/intake/IntakeStepContent';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { canAdvanceIntake, emptyIntake, INTAKE_STEPS, type IntakeFormData } from '@/lib/intake';
import { spacing } from '@/theme';

export default function IntakeScreen() {
  const router = useRouter();
  const { completeIntake } = useAuth();
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeFormData>(emptyIntake);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const styles = useThemedStyles((c) => ({
    progressTrack: { height: 4, backgroundColor: c.border },
    progressFill: { height: 4, backgroundColor: c.accent },
    stepLabel: { fontSize: 13, color: c.faint, fontWeight: '600' as const },
    row: { gap: spacing.sm },
    error: { color: c.danger, fontSize: 14 },
  }));

  const current = INTAKE_STEPS[step];
  const progress = ((step + 1) / INTAKE_STEPS.length) * 100;
  const canAdvance = canAdvanceIntake(step, data);

  const set = (partial: Partial<IntakeFormData>) => setData((prev) => ({ ...prev, ...partial }));

  const onNext = async () => {
    if (step < INTAKE_STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await completeIntake(data);
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <CrisisBar />
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

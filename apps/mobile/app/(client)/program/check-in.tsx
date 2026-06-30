import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useProgramTime } from '@/hooks/useProgramTime';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiGetWeeklyCheckIn, apiSubmitWeeklyCheckIn } from '@/lib/api';

export default function WeeklyCheckInScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const programTime = useProgramTime();
  const weekNumber = programTime?.weekNumber ?? 1;
  const [prompts, setPrompts] = useState<Array<{ id: string; question: string }>>([]);
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const styles = useThemedStyles((c) => ({
    progressBar: { height: 3, backgroundColor: c.border, borderRadius: 2, overflow: 'hidden' as const, marginBottom: 16 },
    progressFill: { height: 3, backgroundColor: c.primary, borderRadius: 2 },
    question: { fontSize: 18, fontWeight: '700' as const, color: c.text, marginBottom: 16, lineHeight: 26 },
    input: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: c.bg,
      textAlignVertical: 'top' as const,
      marginBottom: 16,
    },
    stepLabel: { fontSize: 13, color: c.muted, marginBottom: 8 },
    done: { fontSize: 14, color: c.success, marginTop: 8 },
    muted: { fontSize: 14, color: c.muted },
  }));

  useEffect(() => {
    if (!token) return;
    void apiGetWeeklyCheckIn(token, weekNumber)
      .then((data) => {
        setPrompts(data.prompts);
        if (data.checkIn?.answers) {
          setAnswers(data.checkIn.answers);
          setSaved(true);
        }
      })
      .finally(() => setLoading(false));
  }, [token, weekNumber]);

  const currentPrompt = prompts[currentStep];
  const currentAnswerId = (currentStep === 0 ? 'q1' : currentStep === 1 ? 'q2' : 'q3') as keyof typeof answers;
  const isLastQuestion = currentStep === prompts.length - 1;
  const currentAnswer = answers[currentAnswerId] ?? '';

  const onContinue = () => {
    if (isLastQuestion) {
      onSubmit();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const onSubmit = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const weekStartIso = new Date().toISOString().slice(0, 10);
      await apiSubmitWeeklyCheckIn(token, weekNumber, weekStartIso, answers);
      setSaved(true);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen title="Weekly check-in" subtitle="Help your counselor adapt next week's plan">
        <Text style={styles.muted}>Loading…</Text>
      </Screen>
    );
  }

  if (!currentPrompt) {
    return (
      <Screen title="Weekly check-in" subtitle="Help your counselor adapt next week's plan">
        <Text style={styles.muted}>No prompts available.</Text>
      </Screen>
    );
  }

  const progress = ((currentStep + 1) / prompts.length) * 100;

  return (
    <Screen title="Weekly check-in" subtitle="Help your counselor adapt next week's plan">
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.stepLabel}>
        Question {currentStep + 1} of {prompts.length}
      </Text>

      <Text style={styles.question}>{currentPrompt.question}</Text>

      <TextField
        style={styles.input}
        multiline
        placeholder="Your response…"
        value={currentAnswer}
        onChangeText={(t) => setAnswers((prev) => ({ ...prev, [currentAnswerId]: t } as typeof answers))}
        autoFocus
      />

      {saved && currentStep === 0 ? (
        <Card>
          <Text style={styles.done}>✓ Previously saved for this week</Text>
        </Card>
      ) : null}

      <View style={{ gap: 8 }}>
        <Button
          label={isLastQuestion ? 'Submit check-in' : 'Continue'}
          onPress={onContinue}
          loading={saving}
          disabled={!currentAnswer.trim()}
        />
        {currentStep > 0 ? (
          <Button label="Back" variant="secondary" onPress={() => setCurrentStep((s) => s - 1)} />
        ) : null}
      </View>
    </Screen>
  );
}

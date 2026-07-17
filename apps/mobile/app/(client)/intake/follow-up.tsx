import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { API_URL } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  buildFollowUpPack,
  formatFollowUpAnswers,
  type FollowUpItem,
} from '@/lib/intake-followups';
import { persistOneBoxDraft } from '@/lib/intake-draft-sync';
import { spacing } from '@/theme';

export default function FollowUpScreen() {
  const params = useLocalSearchParams<{
    result: string;
    freeText: string;
    segmentType: string;
    round: string;
    draftAnswers?: string;
    draftStep?: string;
  }>();
  const router = useRouter();
  const { token } = useAuth();
  const round = parseInt(params.round ?? '1', 10);
  const segmentType = params.segmentType ?? 'other';
  const freeText = params.freeText ?? '';

  const questions: FollowUpItem[] = useMemo(() => {
    try {
      return buildFollowUpPack(JSON.parse(params.result ?? '{}'));
    } catch {
      return [];
    }
  }, [params.result]);

  const priorExtraction = useMemo(() => {
    try {
      const parsed = JSON.parse(params.result ?? '{}') as {
        extracted?: unknown;
        summary?: string;
      };
      return JSON.stringify({
        extracted: parsed.extracted,
        summary: parsed.summary,
      });
    } catch {
      return undefined;
    }
  }, [params.result]);

  const [step, setStep] = useState(() => {
    const n = parseInt(params.draftStep ?? '0', 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  });
  const [answers, setAnswers] = useState<string[]>(() => {
    const blank = new Array(questions.length).fill('');
    if (!params.draftAnswers) return blank;
    try {
      const parsed = JSON.parse(params.draftAnswers) as string[];
      if (!Array.isArray(parsed)) return blank;
      return blank.map((_, i) => (typeof parsed[i] === 'string' ? parsed[i] : ''));
    } catch {
      return blank;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = useThemedStyles((c) => ({
    progress: { fontSize: 13, color: c.muted, fontWeight: '600' as const },
    question: { fontSize: 18, color: c.text, fontWeight: '600' as const, lineHeight: 26 },
    helper: { fontSize: 14, color: c.muted, lineHeight: 20 },
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 14,
      padding: spacing.lg,
      backgroundColor: c.surface,
      fontSize: 16,
      minHeight: 120,
      textAlignVertical: 'top' as const,
      lineHeight: 24,
    },
    error: { color: c.danger, fontSize: 14 },
  }));

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistOneBoxDraft(
        {
          step: 'follow-up',
          segmentType,
          freeText,
          round,
          resultJson: params.result ?? '{}',
          followUpAnswers: answers,
          followUpStep: step,
        },
        token,
      );
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [answers, freeText, params.result, round, segmentType, step, token]);

  if (questions.length === 0) {
    return (
      <Screen title="Almost there" subtitle="We have enough to continue." showAccountExit>
        <Button
          label="Back to review"
          onPress={() =>
            router.replace({
              pathname: '/(client)/intake/confirm',
              params: {
                result: params.result ?? '{}',
                freeText,
                segmentType,
                round: String(round),
              },
            })
          }
        />
      </Screen>
    );
  }

  const current = questions[step];
  const answer = answers[step] ?? '';
  const isLast = step >= questions.length - 1;

  const setCurrentAnswer = (text: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = text;
      return next;
    });
  };

  const submitPack = async () => {
    const qaBlock = formatFollowUpAnswers(questions, answers);
    if (!qaBlock.trim()) {
      setError('Please answer at least one question so we can continue.');
      return;
    }
    setLoading(true);
    setError('');
    const combined = `${freeText}\n\n--- Follow-up answers ---\n${qaBlock}`;
    const nextRound = Math.min(round + 1, 3);
    try {
      const res = await fetch(`${API_URL}/api/intake/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          segmentType,
          freeText: combined,
          round: nextRound,
          priorExtraction,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof (body as { detail?: unknown }).detail === 'string'
            ? (body as { detail: string }).detail
            : ((body as { error?: string }).error ?? 'extraction failed');
        throw new Error(msg);
      }
      const resultJson = JSON.stringify(body);
      await persistOneBoxDraft(
        {
          step: 'confirm',
          segmentType,
          freeText: combined,
          round: nextRound,
          resultJson,
        },
        token,
      );
      router.replace({
        pathname: '/(client)/intake/confirm',
        params: {
          result: resultJson,
          freeText: combined,
          segmentType,
          round: String(nextRound),
        },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onNext = () => {
    if (answer.trim().length < 2) {
      setError('A short answer is enough — just a phrase or sentence.');
      return;
    }
    setError('');
    if (isLast) {
      void submitPack();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <Screen
      title="A few quick questions"
      subtitle="One at a time — then we review once and you're done."
      showAccountExit
      scrollToEndOnKeyboard
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button
            label={loading ? 'Updating…' : isLast ? 'Submit answers' : 'Next'}
            onPress={onNext}
            disabled={loading}
            loading={loading}
          />
          {step > 0 ? (
            <Button
              label="Back"
              variant="ghost"
              onPress={() => {
                setError('');
                setStep((s) => Math.max(0, s - 1));
              }}
              disabled={loading}
            />
          ) : (
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} disabled={loading} />
          )}
        </View>
      }
    >
      <View style={{ gap: spacing.md }}>
        <Text style={styles.progress}>
          Question {step + 1} of {questions.length}
        </Text>
        <Text style={styles.question}>{current.question}</Text>
        <Text style={styles.helper}>Write freely — a sentence or two is fine.</Text>
        <TextField
          style={styles.input}
          multiline
          placeholder="Your answer…"
          value={answer}
          onChangeText={setCurrentAnswer}
          accessibilityLabel={current.question}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </Screen>
  );
}

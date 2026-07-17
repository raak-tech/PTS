import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { API_URL } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { persistOneBoxDraft } from '@/lib/intake-draft-sync';
import { spacing } from '@/theme';

const SEGMENT_HINTS: Record<string, string> = {
  pain: 'Tell us about your pain — what hurts, how long, what changed?',
  sleep: 'Tell us about your sleep — trouble falling asleep, staying asleep, or waking up tired?',
  anxiety: 'Tell us what you are feeling — racing thoughts, worry, tension, what weighs on you?',
  injury_recovery: 'Tell us what happened and what you are working to get back to.',
  other: 'Tell us in your own words — no wrong answer.',
};

export default function OneBoxScreen() {
  const { segmentType, round: roundParam, priorExtraction, draftText } = useLocalSearchParams<{
    segmentType?: string;
    round?: string;
    priorExtraction?: string;
    draftText?: string;
  }>();
  const router = useRouter();
  const { token } = useAuth();
  const [text, setText] = useState(typeof draftText === 'string' ? draftText : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const round = parseInt(roundParam ?? '1', 10);
  const hint =
    SEGMENT_HINTS[segmentType ?? ''] ??
    'Tell us what is going on — write freely, we will figure out the rest.';
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = useThemedStyles((c) => ({
    hint: { fontSize: 14, color: c.muted, marginBottom: spacing.md, lineHeight: 21 },
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 14,
      padding: spacing.lg,
      backgroundColor: c.surface,
      fontSize: 16,
      minHeight: 160,
      textAlignVertical: 'top' as const,
      fontFamily: 'System',
      lineHeight: 24,
    },
    charCount: { fontSize: 12, color: c.muted, textAlign: 'right' as const, marginTop: spacing.xs },
    error: { color: c.danger, fontSize: 14, marginTop: spacing.sm },
    footerHint: { fontSize: 13, color: c.muted, textAlign: 'center' as const },
  }));

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const onChangeText = (next: string) => {
    setText(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistOneBoxDraft(
        {
          step: 'onebox',
          segmentType: segmentType ?? 'other',
          freeText: next,
          round,
        },
        token,
      );
    }, 400);
  };

  const handleSubmit = async () => {
    if (text.trim().length < 30) {
      setError('Tell us a bit more — at least a sentence.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/intake/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          segmentType: segmentType ?? 'other',
          freeText: text,
          round,
          priorExtraction: priorExtraction ?? undefined,
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
      const result = body as {
        extractionUsable?: boolean;
        clientSummary?: string;
      };
      if (result.extractionUsable === false) {
        setError(
          result.clientSummary ??
            'We could not understand that. Please describe your situation in plain sentences.',
        );
        return;
      }
      const resultJson = JSON.stringify(body);
      await persistOneBoxDraft(
        {
          step: 'confirm',
          segmentType: segmentType ?? 'other',
          freeText: text,
          round,
          resultJson,
        },
        token,
      );
      router.push({
        pathname: '/(client)/intake/confirm',
        params: {
          result: resultJson,
          freeText: text,
          segmentType: segmentType ?? 'other',
          round: String(round),
        },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = text.trim().length >= 30;
  const charsNeeded = Math.max(0, 30 - text.trim().length);

  return (
    <Screen
      title={round > 1 ? 'A couple more details' : 'Tell us what is going on'}
      subtitle={
        round > 1
          ? 'Your counselor wants to make sure they really understand.'
          : 'Write freely — do not worry about structure.'
      }
      showAccountExit
      scrollToEndOnKeyboard
      footer={
        <View style={{ gap: spacing.sm }}>
          {!canContinue && !loading ? (
            <Text style={styles.footerHint}>
              Keep going — about {charsNeeded} more character{charsNeeded === 1 ? '' : 's'}
            </Text>
          ) : null}
          <Button
            label={loading ? 'Analysing...' : round > 1 ? 'Send' : 'Continue'}
            onPress={handleSubmit}
            disabled={!canContinue || loading}
            loading={loading}
          />
        </View>
      }
    >
      <View style={{ gap: spacing.md }}>
        <Text style={styles.hint}>💡 {hint}</Text>
        <TextField
          style={styles.input}
          multiline
          placeholder="Start typing..."
          value={text}
          onChangeText={onChangeText}
          accessibilityLabel="Tell us what is going on"
        />
        <Text style={styles.charCount}>{text.length} characters</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </Screen>
  );
}

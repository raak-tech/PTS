import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  apiGetInstruments,
  apiGetOutcomeMeasures,
  apiSubmitOutcomeMeasure,
  type InstrumentDef,
} from '@/lib/api';

export default function InstrumentsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { phase } = useLocalSearchParams<{ phase?: string }>();
  const measurePhase = phase === 'week6' ? 'week6' : 'baseline';

  const [instruments, setInstruments] = useState<InstrumentDef[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<string, number>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const styles = useThemedStyles((c) => ({
    intro: { fontSize: 15, color: c.muted, lineHeight: 22 },
    itemText: { fontSize: 15, color: c.text, fontWeight: '600' as const, marginBottom: 8, lineHeight: 21 },
    option: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
      marginBottom: 6,
    },
    optionActive: { borderColor: c.primary, backgroundColor: c.primary + '18' },
    optionText: { fontSize: 14, color: c.text },
    progress: { fontSize: 13, color: c.faint, fontWeight: '700' as const, letterSpacing: 0.5 },
    error: { color: c.danger, fontSize: 14 },
  }));

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const [defs, existing] = await Promise.all([
          apiGetInstruments(token),
          apiGetOutcomeMeasures(token),
        ]);
        const done = new Set(
          existing.measures.filter((m) => m.phase === measurePhase).map((m) => m.instrument),
        );
        const remaining = defs.instruments.filter((d) => !done.has(d.id));
        setInstruments(remaining);
      } catch {
        setError('Could not load the questionnaires. Please try again.');
        setInstruments([]);
      }
    })();
  }, [token, measurePhase]);

  const finish = () => router.replace('/');

  const current = instruments?.[index];

  const currentAnswers = current ? answers[current.id] ?? {} : {};
  const allAnswered = useMemo(() => {
    if (!current) return false;
    return current.items.every((it) => typeof currentAnswers[it.key] === 'number');
  }, [current, currentAnswers]);

  const setAnswer = (itemKey: string, value: number) => {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { ...(prev[current.id] ?? {}), [itemKey]: value },
    }));
  };

  const onNext = async () => {
    if (!token || !current || !allAnswered) return;
    setSubmitting(true);
    setError('');
    try {
      await apiSubmitOutcomeMeasure(token, measurePhase, current.id, currentAnswers);
      if (instruments && index >= instruments.length - 1) {
        finish();
      } else {
        setIndex((i) => i + 1);
      }
    } catch {
      setError('Could not save that answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!instruments) {
    return (
      <Screen title="Loading…" subtitle="" showCrisis={false}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (instruments.length === 0) {
    return (
      <Screen title="All done" subtitle="You've already completed these questionnaires." showCrisis={false}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Continue" onPress={finish} />
      </Screen>
    );
  }

  if (!current) {
    finish();
    return null;
  }

  return (
    <Screen
      title={measurePhase === 'baseline' ? 'A few quick questions' : 'How are things now?'}
      subtitle="These help measure your progress. There are no right or wrong answers."
      showCrisis={false}
    >
      <Text style={styles.progress}>
        {index + 1} OF {instruments.length}
      </Text>
      <Card title={current.title}>
        <Text style={styles.intro}>{current.intro}</Text>
      </Card>

      {current.items.map((item) => (
        <View key={item.key} style={{ marginBottom: 12 }}>
          <Text style={styles.itemText}>{item.text}</Text>
          {current.options.map((opt) => {
            const active = currentAnswers[item.key] === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setAnswer(item.key, opt.value)}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label={index >= instruments.length - 1 ? 'Finish' : 'Next'}
        onPress={() => void onNext()}
        loading={submitting}
        disabled={!allAnswered}
      />
    </Screen>
  );
}

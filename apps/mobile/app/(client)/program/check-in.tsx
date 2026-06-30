import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const styles = useThemedStyles((c) => ({
    label: { fontSize: 15, fontWeight: '600' as const, color: c.text, marginTop: 8 },
    input: {
      minHeight: 80,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: c.bg,
      textAlignVertical: 'top' as const,
      marginTop: 6,
    },
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

  return (
    <Screen title="Weekly check-in" subtitle="Help your counselor adapt next week's plan">
      {loading ? <Text style={styles.muted}>Loading…</Text> : null}
      {prompts.map((p) => (
        <View key={p.id}>
          <Text style={styles.label}>{p.question}</Text>
          <TextField
            style={styles.input}
            multiline
            value={answers[p.id as keyof typeof answers] ?? ''}
            onChangeText={(t) => setAnswers((prev) => ({ ...prev, [p.id]: t } as typeof answers))}
          />
        </View>
      ))}
      {saved ? <Text style={styles.done}>Previously saved for this week — submit again to update.</Text> : null}
      <Button
        label={saved ? 'Update check-in' : 'Submit check-in'}
        onPress={() => void onSubmit()}
        loading={saving}
        disabled={!answers.q1.trim() && !answers.q2.trim() && !answers.q3.trim()}
      />
    </Screen>
  );
}

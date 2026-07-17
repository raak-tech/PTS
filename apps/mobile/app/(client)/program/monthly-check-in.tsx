import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { NRSFaceScale } from '@/components/daily/NRSFaceScale';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiSubmitMonthlyCheckIn } from '@/lib/api';
import { spacing } from '@/theme';

export default function MonthlyCheckInScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [painLevel, setPainLevel] = useState(5);
  const [sleepQuality, setSleepQuality] = useState<'poor' | 'ok' | 'good'>('ok');
  const [intention, setIntention] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const styles = useThemedStyles((c) => ({
    body: { fontSize: 14, color: c.muted, lineHeight: 22, marginBottom: 20 },
    chipRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 20 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'var(--border)',
      backgroundColor: 'transparent',
      color: 'var(--text)',
      fontSize: 13,
      fontWeight: '400' as const,
    },
    chipSelected: {
      backgroundColor: 'var(--bg)',
      borderColor: 'var(--primary)',
      fontWeight: '600' as const,
    },
    input: {
      borderWidth: 1,
      borderColor: 'var(--border)',
      borderRadius: 12,
      padding: 12,
      minHeight: 80,
      backgroundColor: 'var(--bg)',
      marginBottom: 20,
    },
    error: { color: 'var(--danger)', fontSize: 13, marginBottom: 12 },
  }));

  const onSubmit = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await apiSubmitMonthlyCheckIn(token, painLevel, sleepQuality, intention.trim());
      router.replace('/(client)/(tabs)/program');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Your monthly check-in"
      subtitle="How are you doing?"
      scrollToEndOnKeyboard
      footer={
        <Button
          label={loading ? 'Submitting…' : 'Submit monthly check-in'}
          onPress={() => void onSubmit()}
          loading={loading}
          disabled={!intention.trim()}
        />
      }
    >
      <Text style={styles.body}>
        Check in with your counselor about your progress and any adjustments needed to your maintenance plan.
      </Text>

      <NRSFaceScale
        value={painLevel}
        onChange={setPainLevel}
      />

      <Text style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, marginTop: spacing.lg }}>
        Sleep quality
      </Text>
      <View style={styles.chipRow}>
        {(['poor', 'ok', 'good'] as const).map((sq) => (
          <Text
            key={sq}
            onPress={() => setSleepQuality(sq)}
            style={[
              styles.chip,
              sleepQuality === sq && styles.chipSelected,
            ]}
          >
            {sq[0]?.toUpperCase()}{sq.slice(1)}
          </Text>
        ))}
      </View>

      <Text style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
        How's your maintenance going?
      </Text>
      <TextField
        style={styles.input}
        multiline
        placeholder="Share an update on your practice and how you're feeling…"
        value={intention}
        onChangeText={setIntention}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { NRSFaceScale } from '@/components/daily/NRSFaceScale';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiSubmitFlare, type FlareSupportMessage } from '@/lib/api';

export default function FlareUpScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [painLevel, setPainLevel] = useState<number | null>(null);
  const [triggerText, setTriggerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<FlareSupportMessage | null>(null);
  const [safetyConcern, setSafetyConcern] = useState(false);

  const styles = useThemedStyles((c) => ({
    body: { fontSize: 15, color: c.muted, lineHeight: 22 },
    section: { fontSize: 15, color: c.text, lineHeight: 22, marginBottom: 12 },
    alert: { fontSize: 14, color: c.danger, lineHeight: 22, marginTop: 16, fontWeight: '600' as const },
    safety: {
      fontSize: 14,
      color: c.danger,
      lineHeight: 22,
      marginTop: 12,
      padding: 12,
      backgroundColor: c.surface,
      borderRadius: 8,
    },
  }));

  const onSubmit = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiSubmitFlare(token, {
        painLevel: painLevel ?? undefined,
        triggerText: triggerText.trim() || undefined,
      });
      setMessage(res.message);
      setSafetyConcern(res.safetyConcern);
    } catch {
      setMessage({
        opening: "A flare-up is really hard — let's take the next few minutes together.",
        intervention:
          'Pause for a minute. Slow your breathing. Choose one small, kind next step — rest, water, or a change of position.',
        safety:
          "If you're worried this is a new injury, or you feel unsafe, please contact your clinician or use Crisis resources.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <Screen title="Flare-up support" subtitle="You're not back to square one">
        <Card title="Right now">
          <Text style={styles.section}>{message.opening}</Text>
          <Text style={styles.section}>{message.intervention}</Text>
          {message.readOut ? (
            <Text style={[styles.section, { fontStyle: 'italic' }]}>Your read-out: {message.readOut}</Text>
          ) : null}
          <Text style={styles.body}>{message.safety}</Text>
        </Card>
        {safetyConcern ? (
          <Text style={styles.safety}>
            We noticed language that may need urgent support. Please open Crisis resources if you need help now.
          </Text>
        ) : null}
        <View style={{ marginTop: 16, gap: 10 }}>
          <Button label="Crisis resources" variant="secondary" onPress={() => router.push('/(client)/profile/safety')} />
          <Button label="Done for now" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title="Flare-up support"
      subtitle="When pain spikes"
      scrollToEndOnKeyboard
      footer={
        <Button
          label={loading ? 'Getting support…' : 'Get support now'}
          onPress={() => void onSubmit()}
          loading={loading}
        />
      }
    >
      <Text style={styles.body}>
        Tell us what&apos;s happening — we&apos;ll offer a short, supportive next step. This is not diagnosis or
        treatment.
      </Text>
      <View style={{ marginTop: 16 }}>
        <Text style={[styles.body, { marginBottom: 8 }]}>Pain right now (0–10)</Text>
        <NRSFaceScale value={painLevel} onChange={setPainLevel} />
      </View>
      <View style={{ marginTop: 16 }}>
        <TextField
          label="What set it off? (optional)"
          value={triggerText}
          onChangeText={setTriggerText}
          multiline
          placeholder="e.g. slept badly, did too much yesterday, stress at work…"
        />
      </View>
      <Text style={styles.alert}>
        Seek urgent medical care for red-flag symptoms: new severe weakness, loss of bladder/bowel control, fever with
        severe back pain, major trauma, or unexplained weight loss.
      </Text>
    </Screen>
  );
}

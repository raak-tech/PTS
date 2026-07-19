import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  apiGetClinicEnrollment,
  apiRedeemClinicCode,
  apiSetClinicSharingConsent,
} from '@/lib/api';

const DISMISS_KEY = 'pts_clinic_enroll_dismissed';

async function getDismissed(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(DISMISS_KEY) === '1';
  }
  return (await AsyncStorage.getItem(DISMISS_KEY)) === '1';
}

async function setDismissed(): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(DISMISS_KEY, '1');
    return;
  }
  await AsyncStorage.setItem(DISMISS_KEY, '1');
}

const ERROR_COPY: Record<string, string> = {
  invalid_code: "That code wasn't recognised. Check it and try again.",
  expired: 'That code has expired. Ask your clinic for a new one.',
  exhausted: 'That code has already been fully used. Ask your clinic for a new one.',
  clinic_inactive: 'That clinic is not active right now.',
  not_client: 'Only patient accounts can use an enrollment code.',
};

export default function ClinicEnrollScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [phase, setPhase] = useState<'loading' | 'code' | 'consent'>('loading');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [clinicName, setClinicName] = useState('');

  const styles = useThemedStyles((c) => ({
    body: { fontSize: 15, color: c.muted, lineHeight: 22 },
    bullet: { fontSize: 14, color: c.text, lineHeight: 22 },
    input: {
      borderWidth: 2,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 20,
      letterSpacing: 3,
      fontWeight: '700' as const,
      textAlign: 'center' as const,
      backgroundColor: c.surface,
      color: c.text,
    },
    error: { color: c.danger, fontSize: 14 },
  }));

  const goToIntake = () => router.replace('/(client)/intake');

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const { enrollment } = await apiGetClinicEnrollment(token);
        if (enrollment) {
          if (enrollment.consentSharedWithClinic) {
            goToIntake();
            return;
          }
          setEnrollmentId(enrollment.enrollmentId);
          setClinicName(enrollment.clinicName);
          setPhase('consent');
          return;
        }
        if (await getDismissed()) {
          goToIntake();
          return;
        }
        setPhase('code');
      } catch {
        setPhase('code');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onRedeem = async () => {
    if (!token || code.trim().length < 3) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiRedeemClinicCode(token, code.trim());
      setEnrollmentId(res.enrollmentId);
      setClinicName(res.clinicName);
      if (res.consentSharedWithClinic) {
        goToIntake();
        return;
      }
      setPhase('consent');
    } catch (err) {
      const key = err instanceof Error ? err.message : 'invalid_code';
      setError(ERROR_COPY[key] ?? "That code didn't work. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onConsent = async (granted: boolean) => {
    if (!token || !enrollmentId) return;
    setSubmitting(true);
    try {
      await apiSetClinicSharingConsent(token, enrollmentId, granted);
      await setDismissed();
      goToIntake();
    } catch {
      setError('Could not save your choice. Please try again.');
      setSubmitting(false);
    }
  };

  const onSkip = async () => {
    await setDismissed();
    goToIntake();
  };

  if (phase === 'loading') {
    return (
      <Screen title="One moment…" subtitle="" showCrisis={false}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (phase === 'consent') {
    return (
      <Screen
        title={`Share progress with ${clinicName}?`}
        subtitle="Your choice, and you can change it anytime."
        showCrisis={false}
      >
        <Card title="What your clinic would see">
          <Text style={styles.bullet}>• Whether you&apos;re engaging with the program</Text>
          <Text style={styles.bullet}>• High-level progress and which week you&apos;re on</Text>
          <Text style={styles.bullet}>• Your own self-reported physio-exercise completion</Text>
        </Card>
        <Card title="What stays private — always">
          <Text style={styles.bullet}>• Your messages and anything you tell your counselor</Text>
          <Text style={styles.bullet}>• Your reflections, notes, and read-outs</Text>
          <Text style={styles.bullet}>• The detailed content of your plan</Text>
        </Card>
        <Text style={styles.body}>
          This is separate from your PTS program consent. Whatever you choose, you can keep using PTS.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Yes, share with my clinic" onPress={() => void onConsent(true)} loading={submitting} />
        <Button
          label="No, keep it private"
          variant="secondary"
          onPress={() => void onConsent(false)}
          disabled={submitting}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="From your clinic?"
      subtitle="Optional — only if your physio or clinic gave you a code."
      showCrisis={false}
    >
      <Text style={styles.body}>
        Enter the enrollment code from your clinic to link your progress. If you don&apos;t have one,
        you can skip this.
      </Text>
      <TextField
        style={styles.input}
        placeholder="ABC123"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={16}
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Continue" onPress={() => void onRedeem()} loading={submitting} disabled={code.trim().length < 3} />
      <Button label="I don't have a code" variant="ghost" onPress={() => void onSkip()} disabled={submitting} />
    </Screen>
  );
}

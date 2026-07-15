import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { DevMenu } from '@/components/DevMenu';
import { HitTarget } from '@/components/HitTarget';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { API_URL, USE_MOCK_AUTH } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { isValidIndianMobile, normalizePhone } from '@/lib/phone';
import { spacing } from '@/theme';

const PRIVACY_URL = `${API_URL}/privacy`;

export default function LoginScreen() {
  const router = useRouter();
  const { checkPhone, sendOtp, setPendingPhone, signOutIfDifferentPhone } = useAuth();
  const [digits, setDigits] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOpen, setDevOpen] = useState(false);
  const styles = useThemedStyles((c) => ({
    phoneRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm },
    prefix: { fontSize: 18, fontWeight: '700' as const, color: c.text },
    input: {
      flex: 1,
      fontSize: 18,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: c.surface,
    },
    error: { color: c.danger, fontSize: 14 },
    link: { textAlign: 'center' as const, color: c.muted, fontSize: 15, textDecorationLine: 'underline' as const },
    consentRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10, marginTop: 4 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: 2,
    },
    checkboxOn: { backgroundColor: c.primary, borderColor: c.primary },
    checkMark: { color: c.onPrimary, fontWeight: '700' as const, fontSize: 14 },
    consentText: { flex: 1, fontSize: 13, color: c.muted, lineHeight: 19 },
    policyLink: { color: c.accentDark, textDecorationLine: 'underline' as const, fontWeight: '600' as const },
    hint: { fontSize: 12, color: c.faint, textAlign: 'center' as const, lineHeight: 18 },
  }));

  const onContinue = async () => {
    if (!isValidIndianMobile(digits)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!consent) {
      setError('Please agree to the privacy policy to continue.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const phone = normalizePhone(digits);
      await signOutIfDifferentPhone(phone);
      const { exists } = await checkPhone(phone);
      if (!exists) {
        router.push({ pathname: '/(auth)/not-registered', params: { phone } });
        return;
      }
      setPendingPhone(phone);
      await sendOtp(phone, true);
      router.push({ pathname: '/(auth)/otp', params: { phone, consent: '1' } });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'not-registered') {
        router.push({ pathname: '/(auth)/not-registered', params: { phone: normalizePhone(digits) } });
        return;
      }
      if (message === 'too-many-requests') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else if (message === 'sms-failed') {
        setError('Could not send the verification code. Please try again shortly.');
      } else if (message === 'invalid-phone' || message === 'invalid') {
        setError('Enter a valid 10-digit mobile number.');
      } else if (message === 'http-404') {
        setError('This number is not registered. Contact your program administrator.');
      } else if (message.includes('abort') || message.includes('network') || message.includes('fetch')) {
        setError('Cannot reach the server. Check your internet connection and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      subtitle="Sign in with the mobile number registered for your program."
      showCrisis
      scroll={false}
      footer={
        <Button
          label="Continue"
          onPress={onContinue}
          loading={loading}
          disabled={digits.length !== 10 || !consent}
        />
      }
    >
      <Pressable onLongPress={() => USE_MOCK_AUTH && setDevOpen(true)}>
        <BrandMark size="lg" />
      </Pressable>
      <DevMenu visible={devOpen} onClose={() => setDevOpen(false)} />

      <View style={styles.phoneRow}>
        <Text style={styles.prefix}>+91</Text>
        <TextField
          style={styles.input}
          value={digits}
          onChangeText={(t) => setDigits(t.replace(/\D/g, '').slice(0, 10))}
          keyboardType="number-pad"
          placeholder="98765 43210"
          maxLength={10}
          autoComplete="tel"
          autoFocus
        />
      </View>

      <Pressable style={styles.consentRow} onPress={() => setConsent((v) => !v)}>
        <View style={[styles.checkbox, consent ? styles.checkboxOn : null]}>
          {consent ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <Text style={styles.consentText}>
          I agree to the{' '}
          <Text style={styles.policyLink} onPress={() => void Linking.openURL(PRIVACY_URL)}>
            Privacy &amp; Data Policy
          </Text>{' '}
          and consent to PTS storing my responses to support my recovery program.
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <HitTarget onPress={() => router.push('/(auth)/safety')}>
        <Text style={styles.link}>Safety guidelines</Text>
      </HitTarget>

      <Text style={styles.hint}>
        {USE_MOCK_AUTH
          ? 'Test client: 9876543210 · Counselor: 9123456789 · OTP: 123456'
          : 'Use a phone number registered by your program administrator.'}
      </Text>
    </Screen>
  );
}

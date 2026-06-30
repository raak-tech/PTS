import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { DevMenu } from '@/components/DevMenu';
import { HitTarget } from '@/components/HitTarget';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { USE_MOCK_AUTH } from '@/config';
import { isValidIndianMobile, normalizePhone } from '@/lib/phone';
import { spacing } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { checkPhone, sendOtp, setPendingPhone } = useAuth();
  const [digits, setDigits] = useState('');
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
    dev: { marginTop: spacing.lg, alignItems: 'center' as const },
    devText: { fontSize: 13, color: c.faint },
    hint: { fontSize: 12, color: c.faint, textAlign: 'center' as const, lineHeight: 18 },
  }));

  const onContinue = async () => {
    if (!isValidIndianMobile(digits)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const phone = normalizePhone(digits);
      const { exists } = await checkPhone(phone);
      if (!exists) {
        router.push({ pathname: '/(auth)/not-registered', params: { phone } });
        return;
      }
      setPendingPhone(phone);
      await sendOtp(phone);
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen subtitle="Sign in with the mobile number registered for your program." showCrisis scroll={false}>
      <BrandMark size="lg" />

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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Continue" onPress={onContinue} loading={loading} disabled={digits.length !== 10} />

      <HitTarget onPress={() => router.push('/(auth)/safety')}>
        <Text style={styles.link}>Safety guidelines</Text>
      </HitTarget>

      <HitTarget onPress={() => setDevOpen(true)} style={styles.dev}>
        <Text style={styles.devText}>Dev menu</Text>
      </HitTarget>

      <Text style={styles.hint}>
        {USE_MOCK_AUTH
          ? 'Test client: 9876543210 · Counselor: 9123456789 · OTP: 123456'
          : 'Use a phone number registered by your program administrator.'}
      </Text>

      <DevMenu visible={devOpen} onClose={() => setDevOpen(false)} />
    </Screen>
  );
}

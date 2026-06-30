import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatPhoneDisplay } from '@/lib/phone';
import { MOCK_OTP } from '@/mock/data';

export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, sendOtp } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(15);
  const styles = useThemedStyles((c) => ({
    otp: {
      fontSize: 28,
      letterSpacing: 8,
      textAlign: 'center' as const,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      padding: 16,
      backgroundColor: c.surface,
    },
    error: { color: c.danger, fontSize: 14 },
    hint: { fontSize: 13, color: c.faint, textAlign: 'center' as const },
    link: { textAlign: 'center' as const, color: c.text, fontSize: 15, fontWeight: '600' as const },
    linkDisabled: { color: c.faint },
  }));

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onVerify = async () => {
    if (!phone) return;
    setLoading(true);
    setError('');
    try {
      await verifyOtp(phone, code);
      router.replace('/');
    } catch {
      setError('Invalid OTP. Use 123456 in prototype.');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!phone || countdown > 0) return;
    await sendOtp(phone);
    setCountdown(15);
  };

  return (
    <Screen
      title="Enter verification code"
      subtitle={`Code sent to ${formatPhoneDisplay(phone ?? '')}`}
      scroll={false}
    >
      <TextField
        style={styles.otp}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        autoFocus
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.hint}>Prototype OTP: {MOCK_OTP}</Text>

      <Button label="Verify & sign in" onPress={onVerify} loading={loading} disabled={code.length !== 6} />

      <Pressable onPress={onResend} disabled={countdown > 0}>
        <Text style={[styles.link, countdown > 0 && styles.linkDisabled]}>
          {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Change number</Text>
      </Pressable>
    </Screen>
  );
}

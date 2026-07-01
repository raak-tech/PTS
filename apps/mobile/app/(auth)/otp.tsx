import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatPhoneDisplay } from '@/lib/phone';
import { MOCK_OTP } from '@/mock/data';

export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, sendOtp } = useAuth();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(15);
  const styles = useThemedStyles((c) => ({
    boxContainer: { flexDirection: 'row' as const, justifyContent: 'center' as const, gap: 8, marginVertical: 20 },
    box: {
      width: 50,
      height: 50,
      borderWidth: 2,
      borderColor: c.border,
      borderRadius: 12,
      fontSize: 24,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
      color: c.text,
      backgroundColor: c.surface,
    },
    boxFocused: { borderColor: c.primary },
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

  const handleDigitChange = (index: number, value: string) => {
    const numOnly = value.replace(/\D/g, '');
    if (numOnly.length > 1) {
      // User pasted content — distribute digits
      const chars = numOnly.slice(0, 6).split('');
      const newDigits = [...digits];
      for (let i = 0; i < chars.length && index + i < 6; i++) {
        newDigits[index + i] = chars[i];
      }
      setDigits(newDigits);
      // Focus next empty or last
      const nextEmpty = newDigits.findIndex((d, i) => i >= index && d === '');
      if (nextEmpty !== -1) inputRefs.current[nextEmpty]?.focus();
      else inputRefs.current[5]?.focus();
    } else {
      const newDigits = [...digits];
      newDigits[index] = numOnly;
      setDigits(newDigits);
      if (numOnly && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const code = digits.join('');

  const onVerify = async () => {
    if (!phone) return;
    setLoading(true);
    setError('');
    try {
      const sessionUser = await verifyOtp(phone, code);
      if (sessionUser.role === 'provider') {
        router.replace('/(provider)/(tabs)');
        return;
      }
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
      <View style={styles.boxContainer}>
        {digits.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => {
              if (ref) inputRefs.current[i] = ref;
            }}
            style={[styles.box]}
            value={digit}
            onChangeText={(t) => handleDigitChange(i, t)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            autoFocus={i === 0}
          />
        ))}
      </View>

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

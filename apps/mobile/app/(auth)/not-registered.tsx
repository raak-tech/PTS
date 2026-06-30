import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';

export default function NotRegisteredScreen() {
  const router = useRouter();

  return (
    <Screen title="This number isn't registered yet" subtitle="Please contact your counselor or program administrator to get access.">
      <Text style={styles.body}>Once your account is created, return here and sign in with the same mobile number.</Text>
      <Button label="Try another number" onPress={() => router.replace('/(auth)/login')} />
      <Button label="Crisis resources" variant="secondary" onPress={() => router.push('/(auth)/safety')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, color: '#666', lineHeight: 22 },
});

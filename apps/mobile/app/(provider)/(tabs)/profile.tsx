import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const styles = useThemedStyles((c) => ({
    line: { fontSize: 15, color: c.muted, lineHeight: 22 },
    phone: { fontSize: 15, color: c.text, fontWeight: '600' as const, marginBottom: 8 },
  }));

  return (
    <Screen layout="tab" title="Profile" subtitle={user?.displayName ?? 'Counselor account'}>
      {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
      <Text style={styles.line}>Counselor · Pain recovery program</Text>
      <Text style={styles.line}>Session booking is configured on the web dashboard for pilot.</Text>
      <Button
        label="Sign out"
        variant="ghost"
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/login');
        }}
      />
    </Screen>
  );
}

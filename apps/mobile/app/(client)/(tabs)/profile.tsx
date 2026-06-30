import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function ClientProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const styles = useThemedStyles((c) => ({
    phone: { fontSize: 15, color: c.muted, marginTop: -4, marginBottom: 4 },
  }));

  const items = [
    { label: 'Safety guidelines', href: '/(client)/profile/safety' },
    { label: 'Your data & consent', href: '/(client)/profile/data' },
    { label: 'Flare-up support', href: '/(client)/profile/flare-up' },
  ] as const;

  return (
    <Screen layout="tab" title="Profile" subtitle={user?.displayName ?? 'Your account'}>
      {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
      {items.map((item) => (
        <Button key={item.href} label={item.label} variant="secondary" onPress={() => router.push(item.href)} />
      ))}
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

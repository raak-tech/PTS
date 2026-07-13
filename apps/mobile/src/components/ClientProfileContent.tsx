import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { AppBuildInfo } from '@/components/AppBuildInfo';
import { Button } from '@/components/Button';
import { ShareWithCounselorCard } from '@/components/ShareWithCounselorCard';
import { IS_PAIN_SCRIPT_COHORT } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Props = {
  layout?: 'tab' | 'stack';
};

export function ClientProfileContent({ layout = 'stack' }: Props) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const styles = useThemedStyles((c) => ({
    phone: { fontSize: 15, color: c.muted, marginTop: layout === 'tab' ? -4 : 0, marginBottom: 4 },
  }));

  const items = [
    ...(IS_PAIN_SCRIPT_COHORT
      ? [{ label: 'About you', href: '/(client)/profile/about-you' as const }]
      : []),
    { label: 'Safety guidelines', href: '/(client)/profile/safety' },
    { label: 'Privacy & data policy', href: '/(client)/profile/data' },
    { label: 'Flare-up support', href: '/(client)/profile/flare-up' },
  ] as const;

  return (
    <>
      {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
      <ShareWithCounselorCard />
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
      <AppBuildInfo />
    </>
  );
}

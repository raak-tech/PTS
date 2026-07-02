import { ClientProfileContent } from '@/components/ClientProfileContent';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';

export default function ClientProfileTabScreen() {
  const { user } = useAuth();

  return (
    <Screen layout="tab" title="Profile" subtitle={user?.displayName ?? 'Your account'}>
      <ClientProfileContent layout="tab" />
    </Screen>
  );
}

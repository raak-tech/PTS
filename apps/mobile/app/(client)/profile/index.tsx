import { ClientProfileContent } from '@/components/ClientProfileContent';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';

export default function ClientProfileScreen() {
  const { user } = useAuth();

  return (
    <Screen title="Profile" subtitle={user?.displayName ?? 'Your account'}>
      <ClientProfileContent />
    </Screen>
  );
}

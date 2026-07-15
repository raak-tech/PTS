import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ProviderShell } from '@/components/provider/ProviderShell';
import { isAdminUser } from '@/lib/admin';
import { getUserFromCookieHeader } from '@/lib/session';

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));

  if (!user) {
    redirect('/login?next=/provider/clients');
  }

  if (user.role !== 'provider' && !isAdminUser(user)) {
    redirect('/login?error=provider-only');
  }

  return <ProviderShell>{children}</ProviderShell>;
}

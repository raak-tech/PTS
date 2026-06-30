import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getUserFromCookieHeader } from '../../../lib/session';
import { ProviderEngagementClient } from './ProviderEngagementClient';

export const metadata: Metadata = { title: 'Daily engagement | Provider' };

export default async function ProviderEngagementPage() {
  const headersList = await headers();
  const user = await getUserFromCookieHeader(headersList.get('cookie'));
  if (!user || user.role !== 'provider') redirect('/login');

  return <ProviderEngagementClient />;
}

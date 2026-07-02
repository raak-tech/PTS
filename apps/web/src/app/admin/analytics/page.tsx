import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminAnalyticsClient } from './AdminAnalyticsClient';
import { isAdminUser } from '@/lib/admin';
import { getUserFromCookieHeader } from '@/lib/session';

export const metadata: Metadata = { title: 'Admin — Analytics' };

export default async function AdminAnalyticsPage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/admin/analytics');
  if (!isAdminUser(user)) redirect('/');

  return <AdminAnalyticsClient />;
}

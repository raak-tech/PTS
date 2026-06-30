import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminDashboardClient } from './AdminDashboardClient';
import { isAdminUser } from '@/lib/admin';
import { getUserFromCookieHeader } from '@/lib/session';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminPage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/admin');
  if (!isAdminUser(user)) redirect('/');

  return <AdminDashboardClient />;
}

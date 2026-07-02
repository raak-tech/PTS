import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminExplorerClient } from './AdminExplorerClient';
import { isAdminUser } from '@/lib/admin';
import { getUserFromCookieHeader } from '@/lib/session';

export const metadata: Metadata = { title: 'Admin — Data Explorer' };

export default async function AdminExplorerPage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/admin/explorer');
  if (!isAdminUser(user)) redirect('/');

  return <AdminExplorerClient />;
}

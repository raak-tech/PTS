import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminMusicClient } from './AdminMusicClient';
import { isAdminUser } from '@/lib/admin';
import { getUserFromCookieHeader } from '@/lib/session';

export const metadata: Metadata = { title: 'Music catalog | Admin' };

export default async function AdminMusicPage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/admin/music');
  if (!isAdminUser(user)) redirect('/');

  return <AdminMusicClient />;
}

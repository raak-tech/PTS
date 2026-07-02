import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminCostsClient } from './AdminCostsClient';
import { isAdminUser } from '@/lib/admin';
import { getUserFromCookieHeader } from '@/lib/session';

export const metadata: Metadata = { title: 'Admin — LLM Costs' };

export default async function AdminCostsPage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/admin/costs');
  if (!isAdminUser(user)) redirect('/');

  return <AdminCostsClient />;
}

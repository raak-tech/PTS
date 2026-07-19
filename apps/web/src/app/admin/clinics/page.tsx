import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminClinicsClient } from './AdminClinicsClient';
import { isAdminUser } from '@/lib/admin';
import { getUserFromCookieHeader } from '@/lib/session';

export const metadata: Metadata = { title: 'Clinics | Admin' };

export default async function AdminClinicsPage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/admin/clinics');
  if (!isAdminUser(user)) redirect('/');

  return <AdminClinicsClient />;
}
